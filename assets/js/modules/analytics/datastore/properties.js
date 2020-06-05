/**
 * modules/analytics data store: properties.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { isValidAccountID, isValidPropertyID, parsePropertyID, isValidPropertySelection } from '../util';
import { STORE_NAME, PROPERTY_CREATE, PROFILE_CREATE } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
const { createRegistrySelector, createRegistryControl } = Data;

const fetchGetPropertiesProfilesStore = createFetchStore( {
	baseName: 'getPropertiesProfiles',
	controlCallback: ( { accountID } ) => {
		return API.get( 'modules', 'analytics', 'properties-profiles', { accountID }, {
			useCache: false,
		} );
	},
	reducerCallback: ( state ) => {
		// Actual properties, profiles are set by resolver with custom logic,
		// hence here we just set a flag.
		return {
			...state,
			isAwaitingPropertiesProfilesCompletion: true,
		};
	},
	argsToParams: ( accountID ) => {
		invariant( accountID, 'accountID is required.' );
		return { accountID };
	},
} );

// Actions
const FETCH_CREATE_PROPERTY = 'FETCH_CREATE_PROPERTY';
const START_FETCH_CREATE_PROPERTY = 'START_FETCH_CREATE_PROPERTY';
const FINISH_FETCH_CREATE_PROPERTY = 'FINISH_FETCH_CREATE_PROPERTY';
const CATCH_FETCH_CREATE_PROPERTY = 'CATCH_FETCH_CREATE_PROPERTY';

const RECEIVE_CREATE_PROPERTY = 'RECEIVE_CREATE_PROPERTY';
const RECEIVE_MATCHED_PROPERTY = 'RECEIVE_MATCHED_PROPERTY';
const RECEIVE_GET_PROPERTIES = 'RECEIVE_GET_PROPERTIES';
const RECEIVE_PROPERTIES_PROFILES_COMPLETION = 'RECEIVE_PROPERTIES_PROFILES_COMPLETION';
const WAIT_FOR_PROPERTIES = 'WAIT_FOR_PROPERTIES';

const BASE_INITIAL_STATE = {
	isFetchingCreateProperty: {},
	properties: {},
	isAwaitingPropertiesProfilesCompletion: false,
	matchedProperty: undefined,
};

const baseActions = {
	/**
	 * Creates a new Analytics property.
	 *
	 * Creates a new Analytics property for an existing Google Analytics account.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} accountID Google Analytics account ID.
	 * @return {Object} Redux-style action.
	 */
	*createProperty( accountID ) {
		invariant( accountID, 'accountID is required.' );
		let response, error;

		yield {
			payload: { accountID },
			type: START_FETCH_CREATE_PROPERTY,
		};

		try {
			response = yield {
				payload: { accountID },
				type: FETCH_CREATE_PROPERTY,
			};
			const property = response;

			yield baseActions.receiveCreateProperty( { accountID, property } );

			yield {
				payload: { accountID },
				type: FINISH_FETCH_CREATE_PROPERTY,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: {
					accountID,
					error,
				},
				type: CATCH_FETCH_CREATE_PROPERTY,
			};
		}

		return { response, error };
	},

	/**
	 * Adds a property to the data store.
	 *
	 * Adds the newly-created property to the existing properties in
	 * the data store.
	 *
	 * @since 1.8.0
	 * @private
	 *
	 * @param {Object} args           Argument params.
	 * @param {string} args.accountID Google Analytics account ID.
	 * @param {Object} args.property  Google Analytics property object.
	 * @return {Object} Redux-style action.
	 */
	receiveCreateProperty( { accountID, property } ) {
		invariant( accountID, 'accountID is required.' );
		invariant( property, 'property is required.' );

		return {
			payload: { accountID, property },
			type: RECEIVE_CREATE_PROPERTY,
		};
	},

	/**
	 * Adds a matchedProperty to the store.
	 *
	 * @since 1.8.0
	 * @private
	 *
	 * @param {Object} matchedProperty Property object.
	 * @return {Object} Redux-style action.
	 */
	receiveMatchedProperty( matchedProperty ) {
		invariant( matchedProperty, 'matchedProperty is required.' );

		return {
			payload: { matchedProperty },
			type: RECEIVE_MATCHED_PROPERTY,
		};
	},

	/**
	 * Sets the given property and related fields in the store.
	 *
	 * @since 1.8.0
	 * @private
	 *
	 * @param {string} propertyID Property ID to select.
	 * @param {string} [internalPropertyID] Internal property ID (if available).
	 */
	*selectProperty( propertyID, internalPropertyID = '' ) {
		invariant( isValidPropertySelection( propertyID ), 'A valid propertyID selection is required.' );

		const registry = yield Data.commonActions.getRegistry();
		registry.dispatch( STORE_NAME ).setPropertyID( propertyID );

		if ( PROPERTY_CREATE === propertyID ) {
			registry.dispatch( STORE_NAME ).setProfileID( PROFILE_CREATE );
			return;
		}

		const { accountID } = parsePropertyID( propertyID );

		yield baseActions.waitForProperties( accountID );
		const property = registry.select( STORE_NAME ).getPropertyByID( propertyID ) || {};

		if ( ! internalPropertyID ) {
			internalPropertyID = property.internalWebPropertyId;
		}

		registry.dispatch( STORE_NAME ).setInternalWebPropertyID( internalPropertyID || '' );

		if ( property.defaultProfileId ) {
			registry.dispatch( STORE_NAME ).setProfileID( property.defaultProfileId ); // Capitalization rule exception: defaultProfileId
			return;
		}

		// Clear any profile ID selection in the case that selection falls to the getProfiles resolver.
		registry.dispatch( STORE_NAME ).setProfileID( '' );

		const profiles = registry.select( STORE_NAME ).getProfiles( propertyID );
		if ( profiles === undefined ) {
			return; // Selection will happen in in getProfiles resolver.
		}

		const matchedProfile = profiles.find( ( { webPropertyId } ) => webPropertyId === propertyID ) || { id: PROFILE_CREATE }; // Capitalization rule exception: webPropertyId

		registry.dispatch( STORE_NAME ).setProfileID( matchedProfile.id );
	},

	receiveGetProperties( properties, { accountID } ) {
		invariant( Array.isArray( properties ), 'properties must be an array.' );
		invariant( accountID, 'accountID is required.' );

		return {
			payload: { properties, accountID },
			type: RECEIVE_GET_PROPERTIES,
		};
	},

	receivePropertiesProfilesCompletion() {
		return {
			payload: {},
			type: RECEIVE_PROPERTIES_PROFILES_COMPLETION,
		};
	},

	waitForProperties( accountID ) {
		return {
			payload: { accountID },
			type: WAIT_FOR_PROPERTIES,
		};
	},
};

const baseControls = {
	[ FETCH_CREATE_PROPERTY ]: ( { payload: { accountID } } ) => {
		return API.set( 'modules', 'analytics', 'create-property', { accountID } );
	},
	[ WAIT_FOR_PROPERTIES ]: createRegistryControl( ( registry ) => ( { payload: { accountID } } ) => {
		const arePropertiesLoaded = () => registry.select( STORE_NAME ).getProperties( accountID ) !== undefined;

		if ( arePropertiesLoaded() ) {
			return true;
		}

		return new Promise( ( resolve ) => {
			const unsubscribe = registry.subscribe( () => {
				if ( arePropertiesLoaded() ) {
					unsubscribe();
					resolve();
				}
			} );
		} );
	} ),
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_FETCH_CREATE_PROPERTY: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingCreateProperty: {
					...state.isFetchingCreateProperty,
					[ accountID ]: true,
				},
			};
		}

		case FINISH_FETCH_CREATE_PROPERTY: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingCreateProperty: {
					...state.isFetchingCreateProperty,
					[ accountID ]: false,
				},
			};
		}

		case RECEIVE_CREATE_PROPERTY: {
			const { accountID, property } = payload;

			return {
				...state,
				properties: {
					...state.properties || {},
					[ accountID ]: [
						...( state.properties || {} )[ accountID ] || [],
						property,
					],
				},
			};
		}

		case CATCH_FETCH_CREATE_PROPERTY: {
			const { accountID, error } = payload;

			return {
				...state,
				error,
				isFetchingCreateProperty: {
					...state.isFetchingCreateProperty,
					[ accountID ]: false,
				},
			};
		}

		case RECEIVE_MATCHED_PROPERTY: {
			const { matchedProperty } = payload;

			return {
				...state,
				matchedProperty,
			};
		}

		case RECEIVE_GET_PROPERTIES: {
			const { properties, accountID } = payload;

			return {
				...state,
				properties: {
					...state.properties,
					[ accountID ]: [ ...properties ],
				},
			};
		}

		case RECEIVE_PROPERTIES_PROFILES_COMPLETION: {
			return {
				...state,
				isAwaitingPropertiesProfilesCompletion: false,
			};
		}

		default: {
			return { ...state };
		}
	}
};

const baseResolvers = {
	*getProperties( accountID ) {
		if ( ! isValidAccountID( accountID ) ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();
		let properties = registry.select( STORE_NAME ).getProperties( accountID );

		// Only fetch properties if there are none in the store for the given account.
		if ( ! properties ) {
			const { response, error } = yield fetchGetPropertiesProfilesStore.actions.fetchGetPropertiesProfiles( accountID );

			if ( response ) {
				const { dispatch } = registry;

				dispatch( STORE_NAME ).receiveGetProperties( response.properties, { accountID } );

				if ( response.profiles.length && response.profiles[ 0 ] && response.profiles[ 0 ].webPropertyId ) {
					const propertyID = response.profiles[ 0 ].webPropertyId;
					dispatch( STORE_NAME ).receiveProfiles( response.profiles, { propertyID } );
				}

				if ( response.matchedProperty ) {
					dispatch( STORE_NAME ).receiveMatchedProperty( response.matchedProperty );
				}

				dispatch( STORE_NAME ).receivePropertiesProfilesCompletion();

				( { properties } = response );
			}

			if ( error ) {
				return;
			}
		}

		const propertyID = registry.select( STORE_NAME ).getPropertyID();
		if ( ! propertyID ) {
			const property = properties[ 0 ] || { id: PROPERTY_CREATE };
			yield baseActions.selectProperty( property.id, property.internalWebPropertyId ); // Capitalization rule exception: internalWebPropertyId
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the property object by the property ID.
	 *
	 * @since 1.8.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} propertyID Property ID.
	 * @return {(Object|undefined)} Property object, or undefined if not present in store.
	 */
	getPropertyByID( state, propertyID ) {
		if ( ! isValidPropertyID( propertyID ) ) {
			return undefined;
		}
		const { accountID } = parsePropertyID( propertyID );

		return ( state.properties[ accountID ] || [] ).find( ( { id } ) => id === propertyID );
	},

	/**
	 * Gets the matched property, if any.
	 *
	 * @since 1.8.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Matched property if set, otherwise `undefined`.
	 */
	getMatchedProperty( state ) {
		return state.matchedProperty;
	},

	/**
	 * Get all Google Analytics properties this account can access.
	 *
	 * Returns an array of all analytics properties.
	 *
	 * Returns `undefined` if accounts have not yet loaded.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The Analytics Account ID to fetch properties for.
	 * @return {(Array.<Object>|undefined)} An array of Analytics properties; `undefined` if not loaded.
	 */
	getProperties( state, accountID ) {
		const { properties } = state;

		return properties[ accountID ];
	},

	/**
	 * Checks if a property is being created for an account.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The Analytics Account ID to check for property creation.
	 * @return {boolean} `true` if creating a property, `false` if not.
	 */
	isDoingCreateProperty( state, accountID ) {
		const { isFetchingCreateProperty } = state;

		return !! isFetchingCreateProperty[ accountID ];
	},

	/**
	 * Checks if properties are being fetched for the given account.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The Analytics Account ID to check for property creation.
	 * @return {boolean} `true` if fetching a properties, `false` if not.
	 */
	isDoingGetProperties: createRegistrySelector( ( select ) => ( state, accountID ) => {
		// Check if dispatch calls right after fetching are still awaiting.
		if ( state.isAwaitingPropertiesProfilesCompletion ) {
			return true;
		}

		return select( STORE_NAME ).isFetchingGetPropertiesProfiles( accountID );
	} ),
};

const store = Data.combineStores(
	fetchGetPropertiesProfilesStore,
	{
		INITIAL_STATE: BASE_INITIAL_STATE,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const INITIAL_STATE = store.INITIAL_STATE;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;

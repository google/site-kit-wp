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
	reducerCallback: ( state, response, { accountID } ) => {
		// Actual properties, profiles are set by resolver with custom logic,
		// hence here we just set a flag.
		return {
			...state,
			isAwaitingPropertiesProfilesCompletion: {
				...state.isAwaitingPropertiesProfilesCompletion,
				[ accountID ]: true,
			},
		};
	},
	argsToParams: ( accountID ) => {
		return { accountID };
	},
	validateParams: ( { accountID } = {} ) => {
		invariant( accountID, 'accountID is required.' );
	},
} );

const fetchCreatePropertyStore = createFetchStore( {
	baseName: 'createProperty',
	controlCallback: ( { accountID } ) => {
		return API.set( 'modules', 'analytics', 'create-property', { accountID } );
	},
	reducerCallback: ( state, property, { accountID } ) => {
		return {
			...state,
			properties: {
				...state.properties,
				[ accountID ]: [
					...( state.properties[ accountID ] || [] ),
					property,
				],
			},
		};
	},
	argsToParams: ( accountID ) => {
		return { accountID };
	},
	validateParams: ( { accountID } = {} ) => {
		invariant( accountID, 'accountID is required.' );
	},
} );

// Actions
const RECEIVE_MATCHED_PROPERTY = 'RECEIVE_MATCHED_PROPERTY';
const RECEIVE_GET_PROPERTIES = 'RECEIVE_GET_PROPERTIES';
const RECEIVE_PROPERTIES_PROFILES_COMPLETION = 'RECEIVE_PROPERTIES_PROFILES_COMPLETION';
const WAIT_FOR_PROPERTIES = 'WAIT_FOR_PROPERTIES';

const BASE_INITIAL_STATE = {
	properties: {},
	isAwaitingPropertiesProfilesCompletion: {},
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
	 * @param {string} accountID Google Analytics account ID.
	 * @return {Object} Object with `response` and `error`.
	 */
	*createProperty( accountID ) {
		invariant( accountID, 'accountID is required.' );

		const { response, error } = yield fetchCreatePropertyStore.actions.fetchCreateProperty( accountID );
		return { response, error };
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
	 * @return {Object} A Generator function.
	 */
	selectProperty( propertyID, internalPropertyID = '' ) {
		invariant( isValidPropertySelection( propertyID ), 'A valid propertyID selection is required.' );

		return ( function* () {
			const registry = yield Data.commonActions.getRegistry();

			const accountID = registry.select( STORE_NAME ).getAccountID();
			if ( ! isValidAccountID( accountID ) ) {
				return;
			}

			registry.dispatch( STORE_NAME ).setPropertyID( propertyID );

			if ( PROPERTY_CREATE === propertyID ) {
				registry.dispatch( STORE_NAME ).setProfileID( PROFILE_CREATE );
				return;
			}

			yield baseActions.waitForProperties( accountID );
			const property = registry.select( STORE_NAME ).getPropertyByID( propertyID ) || {};

			if ( ! internalPropertyID ) {
				internalPropertyID = property.internalWebPropertyId;
			}

			registry.dispatch( STORE_NAME ).setInternalWebPropertyID( internalPropertyID || '' );

			const profiles = registry.select( STORE_NAME ).getProfiles( accountID, propertyID );
			if ( property.defaultProfileId && profiles?.some( ( profile ) => profile.id === property.defaultProfileId ) ) {
				registry.dispatch( STORE_NAME ).setProfileID( property.defaultProfileId ); // Capitalization rule exception: defaultProfileId
				return;
			}

			// Clear any profile ID selection in the case that selection falls to the getProfiles resolver.
			registry.dispatch( STORE_NAME ).setProfileID( '' );
			if ( profiles === undefined ) {
				return; // Selection will happen in in getProfiles resolver.
			}

			const matchedProfile = profiles.find( ( { webPropertyId } ) => webPropertyId === propertyID ) || { id: PROFILE_CREATE }; // Capitalization rule exception: webPropertyId
			registry.dispatch( STORE_NAME ).setProfileID( matchedProfile.id );
		}() );
	},

	receiveGetProperties( properties, { accountID } ) {
		invariant( Array.isArray( properties ), 'properties must be an array.' );
		invariant( accountID, 'accountID is required.' );

		return {
			payload: { properties, accountID },
			type: RECEIVE_GET_PROPERTIES,
		};
	},

	receivePropertiesProfilesCompletion( accountID ) {
		invariant( accountID, 'accountID is required.' );

		return {
			payload: { accountID },
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
			const { accountID } = payload;

			return {
				...state,
				isAwaitingPropertiesProfilesCompletion: {
					...state.isAwaitingPropertiesProfilesCompletion,
					[ accountID ]: false,
				},
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
		if ( properties === undefined ) {
			const { response, error } = yield fetchGetPropertiesProfilesStore.actions.fetchGetPropertiesProfiles( accountID );
			const { dispatch } = registry;
			if ( response ) {
				dispatch( STORE_NAME ).receiveGetProperties( response.properties, { accountID } );

				if ( response.profiles?.[ 0 ]?.webPropertyId ) {
					const propertyID = response.profiles[ 0 ].webPropertyId;
					dispatch( STORE_NAME ).receiveGetProfiles( response.profiles, { accountID, propertyID } );
				}

				if ( response.matchedProperty ) {
					dispatch( STORE_NAME ).receiveMatchedProperty( response.matchedProperty );
				}

				( { properties } = response );
			}

			dispatch( STORE_NAME ).receivePropertiesProfilesCompletion( accountID );
			if ( error ) {
				// Store error manually since getProperties signature differs from fetchGetPropertiesProfiles.
				yield dispatch( STORE_NAME ).receiveError( error, 'getProperties', [ accountID ] );
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
	isDoingCreateProperty: createRegistrySelector( ( select ) => ( state, accountID ) => {
		return select( STORE_NAME ).isFetchingCreateProperty( accountID );
	} ),

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
		if ( accountID && state.isAwaitingPropertiesProfilesCompletion[ accountID ] ) {
			return true;
		}

		return select( STORE_NAME ).isFetchingGetPropertiesProfiles( accountID );
	} ),
};

const store = Data.combineStores(
	fetchGetPropertiesProfilesStore,
	fetchCreatePropertyStore,
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

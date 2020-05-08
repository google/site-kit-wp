/**
 * modules/search-console data store: properties.
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
const { createRegistryControl } = Data;

// Actions
const FETCH_CREATE_PROPERTY = 'FETCH_CREATE_PROPERTY';
const START_FETCH_CREATE_PROPERTY = 'START_FETCH_CREATE_PROPERTY';
const FINISH_FETCH_CREATE_PROPERTY = 'FINISH_FETCH_CREATE_PROPERTY';
const CATCH_FETCH_CREATE_PROPERTY = 'CATCH_FETCH_CREATE_PROPERTY';

const FETCH_PROPERTIES_PROFILES = 'FETCH_PROPERTIES_PROFILES';
const START_FETCH_PROPERTIES_PROFILES = 'START_FETCH_PROPERTIES_PROFILES';
const FINISH_FETCH_PROPERTIES_PROFILES = 'FINISH_FETCH_PROPERTIES_PROFILES';
const CATCH_FETCH_PROPERTIES_PROFILES = 'CATCH_FETCH_PROPERTIES_PROFILES';

const RECEIVE_CREATE_PROPERTY = 'RECEIVE_CREATE_PROPERTY';
const RECEIVE_MATCHED_PROPERTY = 'RECEIVE_MATCHED_PROPERTY';
const RECEIVE_PROPERTIES = 'RECEIVE_PROPERTIES';
const WAIT_FOR_PROPERTIES = 'WAIT_FOR_PROPERTIES';

export const INITIAL_STATE = {
	isFetchingCreateProperty: {},
	isFetchingPropertiesProfiles: {},
	properties: {},
	matchedProperty: undefined,
};

export const actions = {
	/**
	 * Creates a new Search console property.
	 *
	 * Creates a new Search console property for an existing Google Analytics account.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} accountID Google Search console account ID.
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

			yield actions.receiveCreateProperty( { accountID, property } );

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

	*fetchPropertiesProfiles( accountID ) {
		invariant( accountID, 'accountID is required.' );
		let response, error;

		yield {
			payload: { accountID },
			type: START_FETCH_PROPERTIES_PROFILES,
		};

		try {
			response = yield {
				payload: { accountID },
				type: FETCH_PROPERTIES_PROFILES,
			};
			const { properties, profiles, matchedProperty } = response;
			const { dispatch } = yield Data.commonActions.getRegistry();
			yield actions.receiveProperties( properties, { accountID } );

			if ( matchedProperty ) {
				yield actions.receiveMatchedProperty( matchedProperty );
			}

			if ( profiles.length && profiles[ 0 ] && profiles[ 0 ].webPropertyId ) {
				const propertyID = profiles[ 0 ].webPropertyId;
				dispatch( STORE_NAME ).receiveProfiles( profiles, { propertyID } );
			}

			yield {
				payload: { accountID },
				type: FINISH_FETCH_PROPERTIES_PROFILES,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: {
					accountID,
					error,
				},
				type: CATCH_FETCH_PROPERTIES_PROFILES,
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
	 * @param {string} args.accountID Google Search console account ID.
	 * @param {Object} args.property  Google Search console property object.
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

		yield actions.waitForProperties( accountID );
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

	/**
	 * Adds properties to the store.
	 *
	 * @since 1.8.0
	 * @private
	 *
	 * @param {Array} properties Properties to add.
	 * @param {Object} accountID Account ID to add.
	 * @return {Object} Redux-style action.
	 */
	receiveProperties( properties, { accountID } ) {
		invariant( Array.isArray( properties ), 'properties must be an array.' );
		invariant( accountID, 'accountID is required.' );

		return {
			payload: { properties, accountID },
			type: RECEIVE_PROPERTIES,
		};
	},

	waitForProperties( accountID ) {
		return {
			payload: { accountID },
			type: WAIT_FOR_PROPERTIES,
		};
	},
};

export const controls = {
	[ FETCH_CREATE_PROPERTY ]: ( { payload: { accountID } } ) => {
		return API.set( 'modules', 'Search console', 'create-property', { accountID } );
	},
	[ FETCH_PROPERTIES_PROFILES ]: ( { payload: { accountID } } ) => {
		return API.get( 'modules', 'Search console', 'properties-profiles', { accountID }, {
			useCache: false,
		} );
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

export const reducer = ( state, { type, payload } ) => {
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

		case START_FETCH_PROPERTIES_PROFILES: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingPropertiesProfiles: {
					...state.isFetchingPropertiesProfiles,
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

		case RECEIVE_PROPERTIES: {
			const { properties, accountID } = payload;

			return {
				...state,
				properties: {
					...state.properties,
					[ accountID ]: [ ...properties ],
				},
			};
		}

		case FINISH_FETCH_PROPERTIES_PROFILES: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingPropertiesProfiles: {
					...state.isFetchingPropertiesProfiles,
					[ accountID ]: false,
				},
			};
		}

		case CATCH_FETCH_PROPERTIES_PROFILES: {
			const { accountID, error } = payload;

			return {
				...state,
				error,
				isFetchingPropertiesProfiles: {
					...state.isFetchingPropertiesProfiles,
					[ accountID ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getProperties( accountID ) {
		if ( ! isValidAccountID( accountID ) ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();
		let properties = registry.select( STORE_NAME ).getProperties( accountID );

		// Only fetch properties if there are none in the store for the given account.
		if ( ! properties ) {
			const { response, error } = yield actions.fetchPropertiesProfiles( accountID );
			if ( response && response.properties ) {
				( { properties } = response );
			}
			if ( error ) {
				return;
			}
		}

		const propertyID = registry.select( STORE_NAME ).getPropertyID();
		if ( ! propertyID ) {
			const property = properties[ 0 ] || { id: PROPERTY_CREATE };
			yield actions.selectProperty( property.id, property.internalWebPropertyId ); // Capitalization rule exception: internalWebPropertyId
		}
	},
};

export const selectors = {
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
	 * Get all Google Search console properties this account can access.
	 *
	 * Returns an array of all Search console properties.
	 *
	 * Returns `undefined` if accounts have not yet loaded.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The Search console Account ID to fetch properties for.
	 * @return {(Array.<Object>|undefined)} An array of Search console properties; `undefined` if not loaded.
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
	 * @param {string} accountID The Search console Account ID to check for property creation.
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
	 * @param {string} accountID The Search console Account ID to check for property creation.
	 * @return {boolean} `true` if fetching a properties, `false` if not.
	 */
	isDoingGetProperties( state, accountID ) {
		const { isFetchingPropertiesProfiles } = state;

		return !! isFetchingPropertiesProfiles[ accountID ];
	},
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

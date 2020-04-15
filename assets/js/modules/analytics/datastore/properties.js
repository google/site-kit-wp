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
import { groupBy } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { isValidAccountID, isValidPropertyID, parsePropertyID, isValidPropertySelection } from '../util';
import { STORE_NAME, PROPERTY_CREATE } from './constants';
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
	 * Creates a new Analytics property.
	 *
	 * Creates a new Analytics property for an existing Google Analytics account.
	 *
	 * @since n.e.x.t
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
			const { dispatch } = yield Data.commonActions.getRegistry();
			dispatch( STORE_NAME ).setPropertyID( property.id );
			dispatch( STORE_NAME ).setInternalWebPropertyID( property.internalWebPropertyId );
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
			yield actions.receiveProperties( properties );
			dispatch( STORE_NAME ).receiveProfiles( profiles );

			if ( matchedProperty ) {
				yield actions.receiveMatchedProperty( matchedProperty );
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
	 * @since n.e.x.t
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
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string} propertyID Property ID to select.
	 * @param {string} [internalPropertyID] Internal property ID (if available).
	 */
	*selectProperty( propertyID, internalPropertyID = '' ) {
		invariant( isValidPropertySelection( propertyID ), 'A valid propertyID selection is required.' );

		const registry = yield Data.commonActions.getRegistry();
		registry.dispatch( STORE_NAME ).setPropertyID( propertyID );

		if ( PROPERTY_CREATE !== propertyID && ! internalPropertyID ) {
			const { accountID } = parsePropertyID( propertyID );
			yield actions.waitForProperties( accountID );
			const property = registry.select( STORE_NAME ).getPropertyByID( propertyID ) || {};
			internalPropertyID = property.internalWebPropertyId;
		}

		registry.dispatch( STORE_NAME ).setInternalWebPropertyID( internalPropertyID || '' );

		// Cascading selection.
		registry.dispatch( STORE_NAME ).setProfileForProperty( propertyID );
	},

	/**
	 * Adds properties to the store.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Array} properties Properties to add.
	 * @return {Object} Redux-style action.
	 */
	receiveProperties( properties ) {
		invariant( Array.isArray( properties ), 'properties must be an array.' );

		return {
			payload: { properties },
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
		return API.set( 'modules', 'analytics', 'create-property', { accountID } );
	},
	[ FETCH_PROPERTIES_PROFILES ]: ( { payload: { accountID } } ) => {
		return API.get( 'modules', 'analytics', 'properties-profiles', { accountID }, {
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
			const { properties } = payload;

			return {
				...state,
				properties: {
					...state.properties,
					...groupBy( properties, 'accountId' ), // Capitalization rule exception: `accountId` is a property of an API returned value.
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
			return undefined;
		}

		const registry = yield Data.commonActions.getRegistry();
		let properties = registry.select( STORE_NAME ).getProperties( accountID );

		// Only fetch properties if there are none in the store for the given account.
		if ( ! properties ) {
			const { response } = yield actions.fetchPropertiesProfiles( accountID );
			if ( response && response.properties ) {
				( { properties } = response );
			}
		}

		const propertyID = registry.select( STORE_NAME ).getPropertyID();
		if ( ! propertyID ) {
			const matchedProperty = registry.select( STORE_NAME ).getMatchedProperty();
			const property = matchedProperty || properties[ 0 ] || { id: PROPERTY_CREATE };
			yield actions.selectProperty( property.id, property.internalWebPropertyId );
		}
	},
};

export const selectors = {
	/**
	 * Gets the property object by the property ID.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} propertyID Property ID.
	 * @return {?Object} Property object, or undefined if not present in store.
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
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {?Object} Matched property if set, otherwise `undefined`.
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
	 * @since n.e.x.t
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The Analytics Account ID to fetch properties for.
	 * @return {?Array.<Object>} An array of Analytics properties; `undefined` if not loaded.
	 */
	getProperties( state, accountID ) {
		const { properties } = state;

		return properties[ accountID ];
	},

	/**
	 * Checks if a property is being created for an account.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The Analytics Account ID to check for property creation.
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

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
import { STORE_NAME } from './index';

// Actions
const FETCH_CREATE_PROPERTY = 'FETCH_CREATE_PROPERTY';
const FETCH_PROPERTIES_PROFILES = 'FETCH_PROPERTIES_PROFILES';
const RECEIVE_CREATE_PROPERTY = 'RECEIVE_CREATE_PROPERTY';
const RECEIVE_CREATE_PROPERTY_FAILED = 'RECEIVE_CREATE_PROPERTY_FAILED';
const RECEIVE_PROPERTIES_PROFILES = 'RECEIVE_PROPERTIES_PROFILES';
const RECEIVE_PROPERTIES_PROFILES_FAILED = 'RECEIVE_PROPERTIES_PROFILES_FAILED';

export const INITIAL_STATE = {
	isDoingCreateProperty: {},
	isFetchingPropertiesProfiles: {},
	properties: undefined,
};

export const actions = {
	/**
	 * Creates a new Analytics property.
	 *
	 * Creates a new Analytics property for an existing Google Analytics account.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} accountId Google Analytics account ID.
	 * @return {Object} Redux-style action.
	 */
	*createProperty( accountId ) {
		invariant( accountId, 'accountId is required.' );

		try {
			const response = yield actions.fetchCreateProperty( accountId );

			const { property } = response;

			yield actions.receiveCreateProperty( { accountId, property } );
			yield Data.dispatch( STORE_NAME ).setPropertyID( property.id );
			return;
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveCreatePropertyFailed( { accountId, error } );
		}
	},

	*fetchCreateProperty( accountId ) {
		invariant( accountId, 'accountId is required.' );

		return {
			payload: { accountId },
			type: FETCH_CREATE_PROPERTY,
		};
	},

	*fetchPropertiesProfiles( accountId ) {
		invariant( accountId, 'accountId is required.' );

		return {
			payload: { accountId },
			type: FETCH_PROPERTIES_PROFILES,
		};
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
	 * @param {Object} args Argument params.
	 * @param {string} args.accountId Google Analytics account ID.
	 * @param {Object} args.property Google Analytics property object.
	 * @return {Object} Redux-style action.
	 */
	receiveCreateProperty( { accountId, property } ) {
		invariant( accountId, 'accountId is required' );
		invariant( property, 'property is required' );

		return {
			payload: { accountId, property },
			type: RECEIVE_CREATE_PROPERTY,
		};
	},

	/**
	 * Logs an error with property creation.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} args Argument params.
	 * @param {string} args.accountId Google Analytics account ID.
	 * @param {Object} args.error Error object.
	 * @return {Object} Redux-style action.
	 */
	receiveCreatePropertyFailed( { accountId, error } ) {
		invariant( accountId, 'accountId is required' );
		invariant( error, 'error is required.' );

		return {
			payload: { accountId, error },
			type: RECEIVE_CREATE_PROPERTY_FAILED,
		};
	},

	receivePropertiesProfiles( { accountId, properties, profiles } ) {
		invariant( accountId, 'accountId is required' );
		invariant( properties, 'properties is required' );

		return {
			payload: { accountId, properties, profiles },
			type: RECEIVE_PROPERTIES_PROFILES,
		};
	},

	receivePropertiesProfilesFailed( { accountId, error } ) {
		invariant( accountId, 'accountId is required' );
		invariant( error, 'error is required.' );

		return {
			payload: { accountId, error },
			type: RECEIVE_PROPERTIES_PROFILES_FAILED,
		};
	},
};

export const controls = {
	[ FETCH_CREATE_PROPERTY ]: ( { payload: { accountId } } ) => {
		return API.set( 'modules', 'analytics', 'create-property', { accountID: accountId } );
	},
	[ FETCH_PROPERTIES_PROFILES ]: ( accountId ) => {
		return API.get( 'modules', 'analytics', 'properties-profiles', { accountID: accountId } );
	},
};

export const reducer = ( state, action ) => {
	switch ( action.type ) {
		case FETCH_CREATE_PROPERTY: {
			const { accountId } = action.payload;

			return {
				...state,
				isDoingCreateProperty: {
					...state.isDoingCreateProperty,
					[ accountId ]: true,
				},
			};
		}

		case FETCH_PROPERTIES_PROFILES: {
			const { accountId } = action.payload;

			return {
				...state,
				isFetchingPropertiesProfiles: {
					...state.isFetchingPropertiesProfiles,
					[ accountId ]: true,
				},
			};
		}

		case RECEIVE_CREATE_PROPERTY: {
			const { accountId, property } = action.payload;

			return {
				...state,
				isDoingCreateProperty: {
					...state.isDoingCreateProperty,
					[ accountId ]: false,
				},
				properties: [
					...state.properties || [],
					property,
				],
			};
		}

		case RECEIVE_CREATE_PROPERTY_FAILED: {
			const { accountId, error } = action.payload;

			return {
				...state,
				error,
				isDoingCreateProperty: {
					...state.isDoingCreateProperty,
					[ accountId ]: false,
				},
			};
		}

		case RECEIVE_PROPERTIES_PROFILES: {
			const { accountId, properties, profiles } = action.payload;

			return {
				...state,
				isFetchingPropertiesProfiles: {
					...state.isFetchingPropertiesProfiles,
					[ accountId ]: false,
				},
				properties,
				profiles,
			};
		}

		case RECEIVE_PROPERTIES_PROFILES_FAILED: {
			const { accountId, error } = action.payload;

			return {
				...state,
				error,
				isFetchingPropertiesProfiles: {
					...state.isFetchingPropertiesProfiles,
					[ accountId ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getProperties( accountId ) {
		try {
			const response = yield actions.fetchPropertiesProfiles( accountId );
			const { properties, profiles } = response;

			yield actions.receivePropertiesProfiles( { accountId, properties, profiles } );

			return;
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receivePropertiesProfilesFailed( { accountId, error } );
		}
	},
};

export const selectors = {
	/**
	 * Get all Google Analytics properties this account can access.
	 *
	 * Returns an array of all analytics properties.
	 *
	 * Returns `undefined` if accounts have not yet loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} accountId The Analytics Account ID to fetch properties for.
	 * @return {Array|undefined} An array of Analytics properties; `undefined` if not loaded.
	 */
	getProperties( state, accountId ) {
		invariant( accountId, 'accountId is required' );

		const { properties } = state;

		if ( properties && properties.length ) {
			return properties.filter( ( property ) => {
				return property.accountId === accountId;
			} );
		}

		return properties;
	},

	/**
	 * Check if a property is being created for an account.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} accountId The Analytics Account ID to check for property creation.
	 * @return {boolean} `true` if creating a property, `false` if not.
	 */
	isDoingCreateProperty( state, accountId ) {
		invariant( accountId, 'accountId is required' );

		const { isDoingCreateProperty } = state;

		return !! isDoingCreateProperty[ accountId ];
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

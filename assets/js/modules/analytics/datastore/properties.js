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

// Actions
const FETCH_PROPERTIES_PROFILES = 'FETCH_PROPERTIES_PROFILES';
const RECEIVE_PROPERTIES_PROFILES = 'RECEIVE_PROPERTIES_PROFILES';
const RECEIVE_PROPERTIES_PROFILES_FAILED = 'RECEIVE_PROPERTIES_PROFILES_FAILED';

export const INITIAL_STATE = {
	isFetchingPropertiesProfiles: {},
	properties: undefined,
};

export const actions = {
	*fetchPropertiesProfiles( accountId ) {
		return {
			payload: { accountId },
			type: FETCH_PROPERTIES_PROFILES,
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
	[ FETCH_PROPERTIES_PROFILES ]: ( accountId ) => {
		return API.get( 'modules', 'analytics', 'properties-profiles', { accountID: accountId } );
	},
};

export const reducer = ( state, action ) => {
	switch ( action.type ) {
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
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

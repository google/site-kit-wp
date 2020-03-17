/**
 * modules/analytics data store: analytics info.
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
import { getExistingTag } from 'assets/js/util';
import { STORE_NAME } from './index';

// Actions
const FETCH_ACCOUNTS_PROPERTIES_PROFILES = 'FETCH_ACCOUNTS_PROPERTIES_PROFILES';
const FETCH_EXISTING_TAG = 'FETCH_EXISTING_TAG';
const FETCH_PROPERTIES_PROFILES = 'FETCH_PROPERTIES_PROFILES';
const FETCH_PROFILES = 'FETCH_PROFILES';
const RECEIVE_ACCOUNTS_PROPERTIES_PROFILES = 'RECEIVE_ACCOUNTS_PROPERTIES_PROFILES';
const RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED = 'RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED';
const RECEIVE_EXISTING_TAG = 'RECEIVE_EXISTING_TAG';
const RECEIVE_EXISTING_TAG_FAILED = 'RECEIVE_EXISTING_TAG_FAILED';
const RECEIVE_PROPERTIES_PROFILES = 'RECEIVE_PROPERTIES_PROFILES';
const RECEIVE_PROPERTIES_PROFILES_FAILED = 'RECEIVE_PROPERTIES_PROFILES_FAILED';
const RECEIVE_PROFILES = 'RECEIVE_PROFILES';
const RECEIVE_PROFILES_FAILED = 'RECEIVE_PROFILES_FAILED';

export const INITIAL_STATE = {
	accounts: undefined,
	// connection: undefined,
	// isFetchingConnection: false,
	existingTag: undefined,
	isFetchingAccountsPropertiesProfiles: false,
	isFetchingPropertiesProfiles: {},
	isFetchingProfiles: {},
	isFetchingExistingTag: false,
	properties: undefined,
	profiles: undefined,
};

export const actions = {
	*fetchAccountsPropertiesProfiles() {
		return {
			payload: {},
			type: FETCH_ACCOUNTS_PROPERTIES_PROFILES,
		};
	},

	*fetchExistingTag() {
		return {
			payload: {},
			type: FETCH_EXISTING_TAG,
		};
	},

	*fetchPropertiesProfiles( accountId ) {
		return {
			payload: { accountId },
			type: FETCH_PROPERTIES_PROFILES,
		};
	},

	*fetchProfiles( accountId, propertyId ) {
		return {
			payload: { accountId, propertyId },
			type: FETCH_PROFILES,
		};
	},

	receiveAccountsPropertiesProfiles( { accounts, properties, profiles } ) {
		return {
			payload: { accounts, properties, profiles },
			type: RECEIVE_ACCOUNTS_PROPERTIES_PROFILES,
		};
	},

	receiveAccountsPropertiesProfilesFailed( error ) {
		invariant( error, 'error is required.' );

		return {
			payload: { error },
			type: RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED,
		};
	},

	receiveExistingTag( existingTag ) {
		invariant( existingTag, 'existingTag is required.' );

		return {
			payload: { existingTag },
			type: RECEIVE_EXISTING_TAG,
		};
	},

	receiveExistingTagFailed( error ) {
		invariant( error, 'error is required.' );

		return {
			payload: { error },
			type: RECEIVE_EXISTING_TAG_FAILED,
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

	receiveProfiles( { accountId, propertyId, profiles } ) {
		invariant( accountId, 'accountId is required' );
		invariant( propertyId, 'accountId is required' );
		invariant( profiles, 'profiles is required' );

		return {
			payload: { accountId, propertyId, profiles },
			type: RECEIVE_PROFILES,
		};
	},

	receiveProfilesFailed( { accountId, error, propertyId } ) {
		invariant( accountId, 'accountId is required' );
		invariant( error, 'error is required.' );
		invariant( propertyId, 'accountId is required' );

		return {
			payload: { accountId, error, propertyId },
			type: RECEIVE_PROFILES_FAILED,
		};
	},
};

export const controls = {
	[ FETCH_ACCOUNTS_PROPERTIES_PROFILES ]: () => {
		return API.get( 'modules', 'analytics', 'accounts-properties-profiles' );
	},
	[ FETCH_EXISTING_TAG ]: () => {
		// TODO: Replace this with data from `core/site` selectors and
		// an implementation contained inside the store
		// once https://github.com/google/site-kit-wp/issues/1000 is
		// implemented.
		// TODO: Test this in the future. The underlying implementation is
		// currently quite nested and difficult to straightforwardly test.
		return getExistingTag( 'analytics' );
	},
	[ FETCH_PROPERTIES_PROFILES ]: ( accountId ) => {
		return API.get( 'modules', 'analytics', 'properties-profiles', { accountID: accountId } );
	},
	[ FETCH_PROFILES ]: ( accountId, profileId ) => {
		return API.get( 'modules', 'analytics', 'profiles', { accountID: accountId, profileID: profileId } );
	},
};

export const reducer = ( state, action ) => {
	switch ( action.type ) {
		case FETCH_ACCOUNTS_PROPERTIES_PROFILES: {
			return {
				...state,
				isFetchingAccountsPropertiesProfiles: true,
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

		case FETCH_PROFILES: {
			const { accountId, propertyId } = action.payload;

			return {
				...state,
				isFetchingProfiles: {
					...state.isFetchingProfiles,
					[ `${ accountId }::${ propertyId }` ]: true,
				},
			};
		}

		case FETCH_EXISTING_TAG: {
			return {
				...state,
				isFetchingExistingTag: true,
			};
		}

		case RECEIVE_ACCOUNTS_PROPERTIES_PROFILES: {
			const { accounts, properties, profiles } = action.payload;

			return {
				...state,
				accounts,
				isFetchingAccountsPropertiesProfiles: false,
				properties,
				profiles,
			};
		}

		case RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED: {
			const { error } = action.payload;

			return {
				...state,
				error,
				isFetchingAccountsPropertiesProfiles: false,
			};
		}

		case RECEIVE_EXISTING_TAG: {
			const { existingTag } = action.payload;

			return {
				...state,
				existingTag,
				isFetchingExistingTag: false,
			};
		}

		case RECEIVE_EXISTING_TAG_FAILED: {
			const { error } = action.payload;

			return {
				...state,
				error,
				isFetchingExistingTag: false,
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

		case RECEIVE_PROFILES: {
			const { accountId, propertyId, profiles } = action.payload;

			return {
				...state,
				isFetchingProfiles: {
					...state.isFetchingProfiles,
					[ `${ accountId }::${ propertyId }` ]: false,
				},
				profiles,
			};
		}

		case RECEIVE_PROFILES_FAILED: {
			const { accountId, error, propertyId } = action.payload;

			return {
				...state,
				error,
				isFetchingProfiles: {
					...state.isFetchingProfiles,
					[ `${ accountId }::${ propertyId }` ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getAccounts() {
		try {
			const response = yield actions.fetchAccountsPropertiesProfiles();
			const { accounts, properties, profiles } = response;

			yield actions.receiveAccountsPropertiesProfiles( { accounts, properties, profiles } );

			return;
		} catch ( err ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveAccountsPropertiesProfilesFailed( err );
		}
	},

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

	*getProfiles( accountId, propertyId ) {
		try {
			const response = yield actions.fetchProfiles( accountId, propertyId );
			const { profiles } = response;

			yield actions.receiveProfiles( { accountId, propertyId, profiles } );

			return;
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveProfilesFailed( { accountId, propertyId, error } );
		}
	},

	*getExistingTag() {
		try {
			const existingTag = yield actions.fetchExistingTag( 'analytics' );
			yield actions.receiveExistingTag( existingTag );

			// Invalidate this resolver so it will run again.
			yield Data.stores[ STORE_NAME ].getActions().invalidateResolutionForStoreSelector( 'getExistingTag' );

			return;
		} catch ( err ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveExistingTagFailed( err );
		}
	},
};

export const selectors = {
	/**
	 * Check to see if an existing tag is available on the site.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean|undefined} `true` is a tag exists, `false` if not; `undefined` if not loaded.
	 */
	hasExistingTag() {
		const existingTag = Data.select( STORE_NAME ).getExistingTag();
		return existingTag !== undefined ? !! existingTag : undefined;
	},

	/**
	 * Get all Google Analytics accounts this user can access.
	 *
	 * Returns an array of all analytics accounts.
	 *
	 * Returns `undefined` if accounts have not yet loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Array|undefined} An array of Analytics accounts; `undefined` if not loaded.
	 */
	getAccounts( state ) {
		const { accounts } = state;

		return accounts;
	},

	/**
	 * Get an errors encountered by this store or its side effects.
	 *
	 * Returns an object with the shape when there is an error:
	 * ```
	 * {
	 *   code,
	 *   message,
	 * }
	 * ```
	 *
	 * Returns `null` if there was no error.
	 *
	 * Marked as private, because in the future we'll have more robust error
	 * handling.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|null} Any error encountered with requests in state.
	 */
	getError( state ) {
		const { error } = state;
		return error || null;
	},

	/**
	 * Get an existing tag on the site, if present.
	 *
	 * Returns an object with the shape when successful:
	 * ```
	 * {
	 *   accountID = null,
	 *   propertyID = null,
	 * }
	 * ```
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} Site connection info.
	 */
	getExistingTag( state ) {
		const { existingTag } = state;

		return existingTag;
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
	 * Get all Google Analytics profiles this user account+property has available.
	 *
	 * Returns an array of all profiles.
	 *
	 * Returns `undefined` if accounts have not yet loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} accountId The Analytics Account ID to fetch profiles for.
	 * @param {string} propertyId The Analytics Property ID to fetch profiles for.
	 * @return {Array|undefined} An array of Analytics profiles; `undefined` if not loaded.
	 */
	getProfiles( state, accountId, propertyId ) {
		invariant( accountId, 'accountId is required' );
		invariant( propertyId, 'propertyId is required' );

		const { profiles } = state;

		if ( profiles && profiles.length ) {
			return profiles.filter( ( profile ) => {
				return (
					profile.accountId === accountId &&
					profile.webPropertyId === propertyId
				);
			} );
		}

		return profiles;
	},

	getTagPermission() {
		throw new Error( 'Not yet implemented.' );
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

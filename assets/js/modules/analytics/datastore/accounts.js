/**
 * modules/analytics data store: accounts.
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
const RECEIVE_ACCOUNTS_PROPERTIES_PROFILES = 'RECEIVE_ACCOUNTS_PROPERTIES_PROFILES';
const RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED = 'RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED';
const RECEIVE_EXISTING_TAG = 'RECEIVE_EXISTING_TAG';
const RECEIVE_EXISTING_TAG_FAILED = 'RECEIVE_EXISTING_TAG_FAILED';

export const INITIAL_STATE = {
	accounts: undefined,
	existingTag: undefined,
	isFetchingAccountsPropertiesProfiles: false,
	isFetchingExistingTag: false,
	tagPermissions: {},
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
};

export const reducer = ( state, action ) => {
	switch ( action.type ) {
		case FETCH_ACCOUNTS_PROPERTIES_PROFILES: {
			return {
				...state,
				isFetchingAccountsPropertiesProfiles: true,
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

	*getTagPermission( accountId, propertyId ) {
		try {
			const existingTag = yield actions.fetchTagPermission( accountId, propertyId );
			yield actions.receiveTagPermission( existingTag );

			return;
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveTagPermissionFailed( error );
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
	 * Check permissions for an existing Google Analytics tag.
	 *
	 * Get permissions for a tag based on a Google Analytics `accountId` and
	 * `propertyId`. Useful when an existing tag on the site is found and
	 * you want to verify that an account + property combination has access to
	 * said tag.
	 *
	 * Returns `undefined` if the permission check has not yet loaded.
	 *
	 * @since n.e.x.t
	 * @param {Object} state Data store's state.
	 * @param {string} accountId The Analytics Account ID to fetch permissions for.
	 * @param {string} propertyId The Analytics Property ID to check permissions for.
	 * @param {string} tag The Google Analytics tag identifier to check.
	 * @return {boolean|undefined} `true` if account + property has permission to access the tag, `false` if not; `undefined` if not loaded.
	 */
	getTagPermission( state, accountId, propertyId, tag ) {
		const { tagPermissions } = state;

		if (
			tagPermissions &&
			tagPermissions[ accountId ] &&
			tagPermissions[ accountId ][ propertyId ] !== undefined
		) {
			return tagPermissions[ accountId ][ propertyId ].includes( tag );
		}

		return undefined;
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

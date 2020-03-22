/**
 * modules/analytics data store: tags.
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
const FETCH_EXISTING_TAG = 'FETCH_EXISTING_TAG';
const FETCH_TAG_PERMISSION = 'FETCH_TAG_PERMISSION';
const RECEIVE_EXISTING_TAG = 'RECEIVE_EXISTING_TAG';
const RECEIVE_EXISTING_TAG_FAILED = 'RECEIVE_EXISTING_TAG_FAILED';
const RECEIVE_TAG_PERMISSION = 'RECEIVE_TAG_PERMISSION';
const RECEIVE_TAG_PERMISSION_FAILED = 'RECEIVE_TAG_PERMISSION_FAILED';

export const INITIAL_STATE = {
	existingTag: undefined,
	isFetchingExistingTag: false,
	isFetchingTagPermission: {},
	tagPermissions: undefined,
};

export const actions = {
	*fetchExistingTag() {
		return {
			payload: {},
			type: FETCH_EXISTING_TAG,
		};
	},

	*fetchTagPermission( { accountID, propertyID } ) {
		invariant( accountID, 'accountID is required.' );
		invariant( propertyID, 'propertyID is required.' );

		return {
			payload: { accountID, propertyID },
			type: FETCH_TAG_PERMISSION,
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

	receiveTagPermission( { accountID, propertyID, permission } ) {
		invariant( accountID, 'accountID is required.' );
		invariant( permission !== undefined, 'permission cannot be undefined.' );
		invariant( propertyID, 'propertyID is required.' );

		return {
			payload: { accountID, propertyID, permission },
			type: RECEIVE_TAG_PERMISSION,
		};
	},

	receiveTagPermissionFailed( { accountID, error, propertyID } ) {
		invariant( accountID, 'accountID is required.' );
		invariant( error, 'error is required.' );
		invariant( propertyID, 'propertyID is required.' );

		return {
			payload: { accountID, error, propertyID },
			type: RECEIVE_TAG_PERMISSION_FAILED,
		};
	},
};

export const controls = {
	[ FETCH_EXISTING_TAG ]: () => {
		// TODO: Replace this with data from `core/site` selectors and
		// an implementation contained inside the store
		// once https://github.com/google/site-kit-wp/issues/1000 is
		// implemented.
		// TODO: Test this in the future. The underlying implementation is
		// currently quite nested and difficult to straightforwardly test.
		return getExistingTag( 'analytics' );
	},
	[ FETCH_TAG_PERMISSION ]: ( { payload: { propertyID } } ) => {
		return API.get( 'modules', 'analytics', 'tag-permission', { tag: propertyID } );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case FETCH_EXISTING_TAG: {
			return {
				...state,
				isFetchingExistingTag: true,
			};
		}

		case FETCH_TAG_PERMISSION: {
			const { accountID, propertyID } = payload;

			return {
				...state,
				isFetchingTagPermission: {
					...state.isFetchingTagPermission,
					[ `${ accountID }::${ propertyID }` ]: true,
				},
			};
		}

		case RECEIVE_EXISTING_TAG: {
			const { existingTag } = payload;

			return {
				...state,
				existingTag,
				isFetchingExistingTag: false,
			};
		}

		case RECEIVE_EXISTING_TAG_FAILED: {
			const { error } = payload;

			return {
				...state,
				error,
				isFetchingExistingTag: false,
			};
		}

		case RECEIVE_TAG_PERMISSION: {
			const { accountID, propertyID, permission } = payload;

			return {
				...state,
				isFetchingTagPermission: {
					...state.isFetchingTagPermission,
					[ `${ accountID }::${ propertyID }` ]: false,
				},
				tagPermissions: {
					...state.tagPermissions || {},
					[ `${ accountID }::${ propertyID }` ]: permission,
				},
			};
		}

		case RECEIVE_TAG_PERMISSION_FAILED: {
			const { accountID, propertyID, error } = payload;

			return {
				...state,
				error,
				isFetchingTagPermission: {
					...state.isFetchingTagPermission,
					[ `${ accountID }::${ propertyID }` ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
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

	*getTagPermission( accountID, propertyID ) {
		try {
			const response = yield actions.fetchTagPermission( { accountID, propertyID } );

			const permission = (
				accountID === response.accountID &&
				propertyID === response.propertyID
			);

			yield actions.receiveTagPermission( { accountID, propertyID, permission } );

			return;
		} catch ( error ) {
			// This error code indicates the current user doesn't have access to this
			// tag and shouldn't dispatch an error action.
			if ( error.code === 'google_analytics_existing_tag_permission' ) {
				yield actions.receiveTagPermission( { accountID, propertyID, permission: false } );
				return;
			}

			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveTagPermissionFailed( { accountID, error, propertyID } );
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
	 * Get permissions for a tag based on a Google Analytics `accountID` and
	 * `propertyID`. Useful when an existing tag on the site is found and
	 * you want to verify that an account + property combination has access to
	 * said tag.
	 *
	 * Returns `undefined` if the permission check has not yet loaded.
	 *
	 * @since n.e.x.t
	 * @param {Object} state Data store's state.
	 * @param {string} accountID The Analytics Account ID to fetch permissions for.
	 * @param {string} propertyID The Analytics Property ID to check permissions for.
	 * @return {boolean|undefined} `true` if account + property has permission to access the tag, `false` if not; `undefined` if not loaded.
	 */
	getTagPermission( state, accountID, propertyID ) {
		invariant( accountID, 'accountID is required.' );
		invariant( propertyID, 'propertyID is required.' );

		const { tagPermissions } = state;

		if ( 'undefined' === typeof tagPermissions || 'undefined' === typeof tagPermissions[ `${ accountID }::${ propertyID }` ] ) {
			return undefined;
		}

		return tagPermissions[ `${ accountID }::${ propertyID }` ];
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

/**
 * modules/adsense data store: tags.
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
import { getExistingTag } from '../../../util';
import { STORE_NAME } from './index';

const { commonActions, createRegistrySelector } = Data;

// Actions
const FETCH_EXISTING_TAG = 'FETCH_EXISTING_TAG';
const START_FETCH_EXISTING_TAG = 'START_FETCH_EXISTING_TAG';
const FINISH_FETCH_EXISTING_TAG = 'FINISH_FETCH_EXISTING_TAG';
const CATCH_FETCH_EXISTING_TAG = 'CATCH_FETCH_EXISTING_TAG';

const FETCH_TAG_PERMISSION = 'FETCH_TAG_PERMISSION';
const START_FETCH_TAG_PERMISSION = 'START_FETCH_TAG_PERMISSION';
const FINISH_FETCH_TAG_PERMISSION = 'FINISH_FETCH_TAG_PERMISSION';
const CATCH_FETCH_TAG_PERMISSION = 'CATCH_FETCH_TAG_PERMISSION';

const RECEIVE_EXISTING_TAG = 'RECEIVE_EXISTING_TAG';
const RECEIVE_TAG_PERMISSION = 'RECEIVE_TAG_PERMISSION';

export const INITIAL_STATE = {
	existingTag: undefined,
	isFetchingExistingTag: false,
	isFetchingTagPermission: {},
	tagPermissions: {},
};

export const actions = {
	*fetchExistingTag() {
		let response, error;

		yield {
			payload: {},
			type: START_FETCH_EXISTING_TAG,
		};

		try {
			response = yield {
				payload: {},
				type: FETCH_EXISTING_TAG,
			};

			yield actions.receiveExistingTag( response !== undefined ? response : null );

			yield {
				payload: {},
				type: FINISH_FETCH_EXISTING_TAG,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: { error },
				type: CATCH_FETCH_EXISTING_TAG,
			};
		}

		return { response, error };
	},

	*fetchTagPermission( clientID ) {
		invariant( clientID, 'clientID is required.' );

		let response, error;

		yield {
			payload: { clientID },
			type: START_FETCH_TAG_PERMISSION,
		};

		try {
			response = yield {
				payload: { clientID },
				type: FETCH_TAG_PERMISSION,
			};

			yield actions.receiveTagPermission( {
				clientID,
				...response,
			} );

			yield {
				payload: { clientID },
				type: FINISH_FETCH_TAG_PERMISSION,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: {
					clientID,
					error,
				},
				type: CATCH_FETCH_TAG_PERMISSION,
			};
		}

		return { response, error };
	},

	receiveExistingTag( existingTag ) {
		invariant( existingTag !== undefined, 'existingTag is required.' );

		return {
			payload: { existingTag },
			type: RECEIVE_EXISTING_TAG,
		};
	},

	receiveTagPermission( { clientID, accountID, permission } ) {
		invariant( clientID, 'clientID is required.' );
		invariant( accountID, 'accountID is required.' );
		invariant( permission !== undefined, 'permission cannot be undefined.' );

		return {
			payload: { clientID, accountID, permission },
			type: RECEIVE_TAG_PERMISSION,
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
		return getExistingTag( 'adsense' );
	},
	[ FETCH_TAG_PERMISSION ]: ( { payload: { clientID } } ) => {
		return API.get( 'modules', 'adsense', 'tag-permission', { clientID }, {
			useCache: false,
		} );
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

		case RECEIVE_EXISTING_TAG: {
			const { existingTag } = payload;

			return {
				...state,
				existingTag,
			};
		}

		case FINISH_FETCH_EXISTING_TAG: {
			return {
				...state,
				isFetchingExistingTag: false,
			};
		}

		case CATCH_FETCH_EXISTING_TAG: {
			const { error } = payload;

			return {
				...state,
				error,
				isFetchingExistingTag: false,
			};
		}

		case FETCH_TAG_PERMISSION: {
			const { clientID } = payload;

			return {
				...state,
				isFetchingTagPermission: {
					...state.isFetchingTagPermission,
					[ clientID ]: true,
				},
			};
		}

		case RECEIVE_TAG_PERMISSION: {
			const { clientID, accountID, permission } = payload;

			return {
				...state,
				tagPermissions: {
					...state.tagPermissions || {},
					[ clientID ]: { accountID, permission },
				},
			};
		}

		case FINISH_FETCH_TAG_PERMISSION: {
			const { clientID } = payload;

			return {
				...state,
				isFetchingTagPermission: {
					...state.isFetchingTagPermission,
					[ clientID ]: false,
				},
			};
		}

		case CATCH_FETCH_TAG_PERMISSION: {
			const { clientID, error } = payload;

			return {
				...state,
				error,
				isFetchingTagPermission: {
					...state.isFetchingTagPermission,
					[ clientID ]: false,
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
		const registry = yield commonActions.getRegistry();
		const existingTag = registry.select( STORE_NAME ).getExistingTag();
		if ( existingTag !== undefined ) {
			return;
		}

		yield actions.fetchExistingTag();
	},

	*getTagPermission( clientID ) {
		if ( 'undefined' === typeof clientID ) {
			return;
		}

		const registry = yield commonActions.getRegistry();
		const existingPermission = registry.select( STORE_NAME ).getTagPermission( clientID );
		if ( existingPermission !== undefined ) {
			return;
		}

		yield actions.fetchTagPermission( clientID );
	},
};

export const selectors = {
	/**
	 * Check to see if an existing tag is available on the site.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?boolean} True if a tag exists, false if not; undefined if not loaded.
	 */
	hasExistingTag: createRegistrySelector( ( select ) => () => {
		const existingTag = select( STORE_NAME ).getExistingTag();

		return existingTag !== undefined ? !! existingTag : undefined;
	} ),

	/**
	 * Get an existing tag on the site, if present.
	 *
	 * Returns an object with the shape when successful:
	 * ```
	 * {
	 *   accountID = null,
	 *   clientID = null,
	 * }
	 * ```
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?Object} Site connection info.
	 */
	getExistingTag( state ) {
		const { existingTag } = state;

		return existingTag;
	},

	/**
	 * Checks whether the user has access to an existing Google AdSense tag / client.
	 *
	 * This can be an existing tag found on the site, or any Google AdSense client.
	 * If the account ID is known, it should be specified as well.
	 *
	 * Returns `undefined` if the permission check has not yet loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} clientID The AdSense Client ID to check permissions for.
	 * @return {?boolean} True if the user has access, false if not; `undefined` if not loaded.
	 */
	hasTagPermission: createRegistrySelector( ( select ) => ( state, clientID ) => {
		const { permission } = select( STORE_NAME ).getTagPermission( state, clientID ) || {};

		return permission;
	} ),

	/**
	 * Checks permissions for an existing Google AdSense tag / client.
	 *
	 * This can be an existing tag found on the site, or any Google AdSense client.
	 * If the account ID is known, it should be specified as well.
	 *
	 * Returns `undefined` if the permission check has not yet loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} clientID The AdSense Client ID to check permissions for.
	 * @return {?Object} Object with string `accountID` and boolean `permission` properties; `undefined` if not loaded.
	 */
	getTagPermission( state, clientID ) {
		const { tagPermissions } = state;

		return tagPermissions[ clientID ];
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

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
import { getExistingTag } from '../../../util';
import { STORE_NAME } from './constants';
import { isValidPropertyID } from '../util';

const { commonActions, createRegistrySelector, createRegistryControl } = Data;

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
const WAIT_FOR_EXISTING_TAG = 'WAIT_FOR_EXISTING_TAG';

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

	*fetchTagPermission( propertyID ) {
		invariant( propertyID, 'propertyID is required.' );
		let response, error;

		yield {
			payload: { propertyID },
			type: START_FETCH_TAG_PERMISSION,
		};

		try {
			response = yield {
				payload: { propertyID },
				type: FETCH_TAG_PERMISSION,
			};

			yield actions.receiveTagPermission( {
				propertyID,
				...response,
			} );

			yield {
				payload: { propertyID },
				type: FINISH_FETCH_TAG_PERMISSION,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: {
					propertyID,
					error,
				},
				type: CATCH_FETCH_TAG_PERMISSION,
			};
		}

		return { response, error };
	},

	receiveExistingTag( existingTag ) {
		invariant( existingTag !== undefined, 'existingTag cannot be undefined.' );

		return {
			payload: { existingTag },
			type: RECEIVE_EXISTING_TAG,
		};
	},

	receiveTagPermission( { propertyID, accountID, permission } ) {
		invariant( propertyID, 'propertyID is required.' );
		invariant( accountID, 'accountID is required.' );
		invariant( permission !== undefined, 'permission cannot be undefined.' );

		return {
			payload: { propertyID, accountID, permission },
			type: RECEIVE_TAG_PERMISSION,
		};
	},

	waitForExistingTag() {
		return {
			payload: {},
			type: WAIT_FOR_EXISTING_TAG,
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
		return API.get( 'modules', 'analytics', 'tag-permission', { propertyID }, {
			useCache: false,
		} );
	},
	[ WAIT_FOR_EXISTING_TAG ]: createRegistryControl( ( registry ) => () => {
		const isExistingTagLoaded = () => registry.select( STORE_NAME ).getExistingTag() !== undefined;
		if ( isExistingTagLoaded() ) {
			return true;
		}

		return new Promise( ( resolve ) => {
			const unsubscribe = registry.subscribe( () => {
				if ( isExistingTagLoaded() ) {
					unsubscribe();
					resolve();
				}
			} );
		} );
	} ),
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_FETCH_EXISTING_TAG: {
			return {
				...state,
				isFetchingExistingTag: true,
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

		case START_FETCH_TAG_PERMISSION: {
			const { propertyID } = payload;

			return {
				...state,
				isFetchingTagPermission: {
					...state.isFetchingTagPermission,
					[ propertyID ]: true,
				},
			};
		}

		case FINISH_FETCH_TAG_PERMISSION: {
			const { propertyID } = payload;

			return {
				...state,
				isFetchingTagPermission: {
					...state.isFetchingTagPermission,
					[ propertyID ]: false,
				},
			};
		}

		case CATCH_FETCH_TAG_PERMISSION: {
			const { propertyID, error } = payload;

			return {
				...state,
				error,
				isFetchingTagPermission: {
					...state.isFetchingTagPermission,
					[ propertyID ]: false,
				},
			};
		}

		case RECEIVE_EXISTING_TAG: {
			const { existingTag } = payload;

			return {
				...state,
				existingTag,
			};
		}

		case RECEIVE_TAG_PERMISSION: {
			const { propertyID, accountID, permission } = payload;

			return {
				...state,
				tagPermissions: {
					...state.tagPermissions || {},
					[ propertyID ]: { accountID, permission },
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
		const registry = yield Data.commonActions.getRegistry();

		const existingTag = registry.select( STORE_NAME ).getExistingTag();

		if ( existingTag === undefined ) {
			yield actions.fetchExistingTag();
		}
	},

	*getTagPermission( propertyID ) {
		if ( ! isValidPropertyID( propertyID ) ) {
			return;
		}

		const registry = yield commonActions.getRegistry();

		// If these permissions are already available, don't make a request.
		if ( registry.select( STORE_NAME ).getTagPermission( propertyID ) !== undefined ) {
			return;
		}

		yield actions.fetchTagPermission( propertyID );
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
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?string} Existing tag, or `null` if none.
	 *                   Returns `undefined` if not resolved yet.
	 */
	getExistingTag( state ) {
		const { existingTag } = state;

		return existingTag;
	},

	/**
	 * Checks whther the user has access to the existing Analytics tag.
	 *
	 * @since n.e.x.t
	 *
	 * @return {?boolean} true or false if tag permission is available,
	 *                    null if no existing tag,
	 *                    otherwise undefined if resolution is incomplete.
	 */
	hasExistingTagPermission: createRegistrySelector( ( select ) => () => {
		const hasExistingTag = select( STORE_NAME ).hasExistingTag();

		if ( hasExistingTag === undefined ) {
			return undefined;
		} else if ( hasExistingTag ) {
			const propertyID = select( STORE_NAME ).getExistingTag();

			return select( STORE_NAME ).hasTagPermission( propertyID );
		}

		return null;
	} ),

	/**
	 * Checks whether the user has access to an existing Google Analytics tag / property.
	 *
	 * This can be an existing tag found on the site, or any Google Analytics property.
	 * If the account ID is known, it should be specified as well.
	 *
	 * Returns `undefined` if the permission check has not yet loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID The Analytics Property ID to check permissions for.
	 * @return {?boolean} True if the user has access, false if not; `undefined` if not loaded.
	 */
	hasTagPermission: createRegistrySelector( ( select ) => ( state, propertyID ) => {
		const { permission } = select( STORE_NAME ).getTagPermission( propertyID ) || {};
		return permission;
	} ),

	/**
	 * Checks permissions for an existing Google Analytics tag / property.
	 *
	 * This can be an existing tag found on the site, or any Google Analytics property.
	 * If the account ID is known, it should be specified as well.
	 *
	 * Returns `undefined` if the permission check has not yet loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID The Analytics Property ID to check permissions for.
	 * @return {?Object} Object with string `accountID` and boolean `permission` properties; `undefined` if not loaded.
	 */
	getTagPermission( state, propertyID ) {
		const { tagPermissions } = state;

		return tagPermissions[ propertyID ];
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

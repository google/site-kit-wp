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
import { getExistingTag } from '../../../util/tag';
import { STORE_NAME } from './constants';
import { isValidPropertyID } from '../util';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const { createRegistrySelector, createRegistryControl } = Data;

const fetchGetExistingTagStore = createFetchStore( {
	baseName: 'getExistingTag',
	controlCallback: () => {
		// TODO: Replace this with data from `core/site` selectors and
		// an implementation contained inside the store
		// once https://github.com/google/site-kit-wp/issues/1000 is
		// implemented.
		// TODO: Test this in the future. The underlying implementation is
		// currently quite nested and difficult to straightforwardly test.
		return getExistingTag( 'analytics' );
	},
	reducerCallback: ( state, existingTag ) => {
		return {
			...state,
			existingTag: existingTag || null,
		};
	},
} );

const fetchGetTagPermissionStore = createFetchStore( {
	baseName: 'getTagPermission',
	controlCallback: ( { propertyID } ) => {
		return API.get( 'modules', 'analytics', 'tag-permission', { propertyID }, {
			useCache: false,
		} );
	},
	reducerCallback: ( state, { accountID, permission }, { propertyID } ) => {
		return {
			...state,
			tagPermissions: {
				...state.tagPermissions || {},
				[ propertyID ]: { accountID, permission },
			},
		};
	},
	argsToParams: ( propertyID ) => {
		invariant( propertyID, 'propertyID is required.' );
		return { propertyID };
	},
} );

// Actions
const WAIT_FOR_EXISTING_TAG = 'WAIT_FOR_EXISTING_TAG';

const BASE_INITIAL_STATE = {
	existingTag: undefined,
	tagPermissions: {},
};

const baseActions = {
	waitForExistingTag() {
		return {
			payload: {},
			type: WAIT_FOR_EXISTING_TAG,
		};
	},
};

const baseControls = {
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

const baseResolvers = {
	*getExistingTag() {
		const registry = yield Data.commonActions.getRegistry();

		const existingTag = registry.select( STORE_NAME ).getExistingTag();

		if ( existingTag === undefined ) {
			yield fetchGetExistingTagStore.actions.fetchGetExistingTag();
		}
	},

	*getTagPermission( propertyID ) {
		if ( ! isValidPropertyID( propertyID ) ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();

		// If these permissions are already available, don't make a request.
		if ( registry.select( STORE_NAME ).getTagPermission( propertyID ) !== undefined ) {
			return;
		}

		yield fetchGetTagPermissionStore.actions.fetchGetTagPermission( propertyID );
	},
};

const baseSelectors = {
	/**
	 * Check to see if an existing tag is available on the site.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} True if a tag exists, false if not; undefined if not loaded.
	 */
	hasExistingTag: createRegistrySelector( ( select ) => () => {
		const existingTag = select( STORE_NAME ).getExistingTag();

		return existingTag !== undefined ? !! existingTag : undefined;
	} ),

	/**
	 * Get an existing tag on the site, if present.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} Existing tag, or `null` if none.
	 *                   Returns `undefined` if not resolved yet.
	 */
	getExistingTag( state ) {
		const { existingTag } = state;

		if ( existingTag === undefined ) {
			return undefined;
		}

		// It's possible to have an invalid accountID saved by something like the
		// AMP plugin (see: https://github.com/google/site-kit-wp/issues/1651).
		// Before returning a tag we should make sure it's valid.
		return !! existingTag && isValidPropertyID( existingTag ) ? existingTag : null;
	},

	/**
	 * Checks whether the user has access to the existing Analytics tag.
	 *
	 * @since 1.8.0
	 *
	 * @return {(boolean|undefined)} true or false if tag permission is available,
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
	 * @since 1.8.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID The Analytics Property ID to check permissions for.
	 * @return {(boolean|undefined)} True if the user has access, false if not; `undefined` if not loaded.
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
	 * @since 1.8.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID The Analytics Property ID to check permissions for.
	 * @return {(Object|undefined)} Object with string `accountID` and boolean `permission` properties; `undefined` if not loaded.
	 */
	getTagPermission( state, propertyID ) {
		const { tagPermissions } = state;

		return tagPermissions[ propertyID ];
	},
};

const store = Data.combineStores(
	fetchGetExistingTagStore,
	fetchGetTagPermissionStore,
	{
		INITIAL_STATE: BASE_INITIAL_STATE,
		actions: baseActions,
		controls: baseControls,
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

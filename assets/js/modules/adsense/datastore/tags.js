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
import { STORE_NAME } from './constants';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { getExistingTagURLs, extractExistingTag } from '../../../util/tag';
import { tagMatchers } from '../util';

const { commonActions, createRegistrySelector } = Data;

const fetchGetExistingTagStore = createFetchStore( {
	baseName: 'getExistingTag',
	controlCallback: async () => {
		const existingTagURLs = await getExistingTagURLs( Data.select( CORE_SITE ) );
		let tagFound = null;
		for ( const url of existingTagURLs ) {
			const html = await Data.select( CORE_SITE ).getHTMLForURL( url );
			tagFound = extractExistingTag( html, tagMatchers );
			if ( tagFound ) {
				return tagFound;
			}
		}
		return	tagFound || null;
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
	controlCallback: ( { clientID } ) => {
		return API.get( 'modules', 'adsense', 'tag-permission', { clientID }, {
			useCache: false,
		} );
	},
	reducerCallback: ( state, { accountID, permission }, { clientID } ) => {
		return {
			...state,
			tagPermissions: {
				...state.tagPermissions || {},
				[ clientID ]: { accountID, permission },
			},
		};
	},
	argsToParams: ( clientID ) => {
		invariant( clientID, 'clientID is required.' );
		return { clientID };
	},
} );

const BASE_INITIAL_STATE = {
	existingTag: undefined,
	tagPermissions: {},
};

const baseResolvers = {
	*getExistingTag() {
		const registry = yield commonActions.getRegistry();
		const existingTag = registry.select( STORE_NAME ).getExistingTag();
		if ( existingTag !== undefined ) {
			return;
		}

		yield fetchGetExistingTagStore.actions.fetchGetExistingTag();
	},

	*getTagPermission( clientID ) {
		if ( undefined === clientID ) {
			return;
		}

		const registry = yield commonActions.getRegistry();
		const existingPermission = registry.select( STORE_NAME ).getTagPermission( clientID );
		if ( existingPermission !== undefined ) {
			return;
		}

		yield fetchGetTagPermissionStore.actions.fetchGetTagPermission( clientID );
	},
};

const baseSelectors = {
	/**
	 * Check to see if an existing tag is available on the site.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} True if a tag exists, false if not; undefined if not loaded.
	 */
	hasExistingTag: createRegistrySelector( ( select ) => () => {
		const existingTag = select( STORE_NAME ).getExistingTag();

		return existingTag !== undefined ? !! existingTag : undefined;
	} ),

	/**
	 * Gets an existing tag on the site, if present.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} Existing tag, or `null` if none.
	 *                   Returns `undefined` if not resolved yet.
	 */
	getExistingTag( state ) {
		const { existingTag } = state;

		return existingTag;
	},

	/**
	 * Checks whether the user has access to the existing AdSense tag.
	 *
	 * @since 1.9.0
	 *
	 * @return {(boolean|null|undefined)} true or false if tag permission is available,
	 *                                    null if no existing tag,
	 *                                    otherwise undefined if resolution is incomplete.
	 */
	hasExistingTagPermission: createRegistrySelector( ( select ) => () => {
		const hasExistingTag = select( STORE_NAME ).hasExistingTag();

		if ( hasExistingTag === undefined ) {
			return undefined;
		} else if ( hasExistingTag ) {
			const clientID = select( STORE_NAME ).getExistingTag();

			return select( STORE_NAME ).hasTagPermission( clientID );
		}

		return null;
	} ),

	/**
	 * Checks whether the user has access to an existing Google AdSense tag / client.
	 *
	 * This can be an existing tag found on the site, or any Google AdSense client.
	 * If the account ID is known, it should be specified as well.
	 *
	 * Returns `undefined` if the permission check has not yet loaded.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} clientID The AdSense Client ID to check permissions for.
	 * @return {(boolean|undefined)} True if the user has access, false if not; `undefined` if not loaded.
	 */
	hasTagPermission: createRegistrySelector( ( select ) => ( state, clientID ) => {
		const { permission } = select( STORE_NAME ).getTagPermission( clientID ) || {};

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
	 * @since 1.9.0
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} clientID The AdSense Client ID to check permissions for.
	 * @return {(Object|undefined)} Object with string `accountID` and boolean `permission` properties; `undefined` if not loaded.
	 */
	getTagPermission( state, clientID ) {
		const { tagPermissions } = state;

		return tagPermissions[ clientID ];
	},
};

const store = Data.combineStores(
	fetchGetExistingTagStore,
	fetchGetTagPermissionStore,
	{
		INITIAL_STATE: BASE_INITIAL_STATE,
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

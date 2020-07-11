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
import { isValidClientID } from '../util';
import tagMatchers from '../util/tagMatchers';

const { commonActions, createRegistryControl, createRegistrySelector } = Data;

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

// Actions
const GET_EXISTING_TAG = 'FETCH_EXISTING_TAG';
const RECEIVE_EXISTING_TAG = 'RECEIVE_EXISTING_TAG';
const WAIT_FOR_EXISTING_TAG = 'WAIT_FOR_EXISTING_TAG';

const BASE_INITIAL_STATE = {
	existingTag: undefined,
	tagPermissions: {},
};

const baseActions = {
	getExistingTag() {
		return {
			payload: {},
			type: GET_EXISTING_TAG,
		};
	},
	receiveGetExistingTag( existingTag ) {
		invariant(
			existingTag === null || isValidClientID( existingTag ),
			'existingTag must be a valid property ID or null.'
		);

		return {
			payload: { existingTag },
			type: RECEIVE_EXISTING_TAG,
		};
	},
	waitForExistingTag() {
		return {
			payload: {},
			type: WAIT_FOR_EXISTING_TAG,
		};
	},
};

const baseControls = {
	[ GET_EXISTING_TAG ]: createRegistryControl( ( registry ) => async () => {
		const homeURL = registry.select( CORE_SITE ).getHomeURL();
		const ampMode = registry.select( CORE_SITE ).getAMPMode();
		const existingTagURLs = await getExistingTagURLs( { homeURL, ampMode } );

		for ( const url of existingTagURLs ) {
			await registry.dispatch( CORE_SITE ).waitForHTMLForURL( url );
			const html = registry.select( CORE_SITE ).getHTMLForURL( url );
			const tagFound = extractExistingTag( html, tagMatchers );
			if ( tagFound ) {
				return tagFound;
			}
		}

		return	null;
	} ),
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

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case RECEIVE_EXISTING_TAG: {
			const { existingTag } = payload;

			return {
				...state,
				existingTag,
			};
		}

		default: {
			return { ...state };
		}
	}
};

const baseResolvers = {
	*getExistingTag() {
		const registry = yield Data.commonActions.getRegistry();

		if ( registry.select( STORE_NAME ).getExistingTag() === undefined ) {
			const existingTag = yield baseActions.getExistingTag();
			registry.dispatch( STORE_NAME ).receiveGetExistingTag( existingTag );
		}
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
		return state.existingTag;
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
	fetchGetTagPermissionStore,
	{
		INITIAL_STATE: BASE_INITIAL_STATE,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
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

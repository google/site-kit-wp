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
import { STORE_NAME } from './constants';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { isValidPropertyID } from '../util';
import tagMatchers from '../util/tagMatchers';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { getExistingTagURLs, extractExistingTag } from '../../../util/tag';

const { createRegistrySelector, createRegistryControl } = Data;

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
			existingTag === null || isValidPropertyID( existingTag ),
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
		const existingTagURLs = await getExistingTagURLs( homeURL, ampMode );

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
		return state.existingTag;
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

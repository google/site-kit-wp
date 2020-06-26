/**
 * modules/tagmanager data store: existing tag.
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
import { getExistingTagURLs, extractExistingTag } from '../../../util/tag';
import { tagMatchers } from '../util';
import { isValidContainerID, isValidContainerSelection } from '../util/validation';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const { createRegistrySelector } = Data;

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
		return Promise.resolve( tagFound || null );
	},
	reducerCallback: ( state, existingTag ) => {
		return {
			...state,
			existingTag,
		};
	},
} );

const fetchGetTagPermissionStore = createFetchStore( {
	baseName: 'getTagPermission',
	argsToParams: ( containerID ) => {
		invariant( isValidContainerID( containerID ), 'A valid containerID is required to for fetching permission.' );

		return { containerID };
	},
	controlCallback: ( { containerID } ) => API.get( 'modules', 'tagmanager', 'tag-permission', { containerID }, { useCache: false } ),
	reducerCallback: ( state, { accountID, permission }, { containerID } ) => {
		return {
			...state,
			tagPermission: {
				...state.tagPermission,
				[ containerID ]: {
					accountID,
					permission,
				},
			},
		};
	},
} );

const BASE_INITIAL_STATE = {
	existingTag: undefined,
	tagPermission: {},
};

const baseResolvers = {
	*getExistingTag() {
		const { select } = yield Data.commonActions.getRegistry();

		if ( select( STORE_NAME ).getExistingTag() === undefined ) {
			yield fetchGetExistingTagStore.actions.fetchGetExistingTag();
		}
	},

	*getTagPermission( containerID ) {
		if ( ! isValidContainerSelection( containerID ) ) {
			return;
		}
		const { select } = yield Data.commonActions.getRegistry();

		if ( select( STORE_NAME ).hasTagPermission( containerID ) === undefined ) {
			yield fetchGetTagPermissionStore.actions.fetchGetTagPermission( containerID );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the existing tag (a container publicId), if any.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} The existing container ID if present, `null` if not present, or `undefined` if not loaded yet.
	 */
	getExistingTag( state ) {
		return state.existingTag;
	},

	/**
	 * Checks permissions for an existing Google Tag Manager container.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} containerID Container publicId to check permission for.
	 * @return {(Object|undefined)} Object with string `accountID` and boolean `permission` properties; `undefined` if not loaded.
	 */
	getTagPermission( state, containerID ) {
		return state.tagPermission[ containerID ];
	},

	/**
	 * Checks whether or not an existing tag is present.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(boolean|undefined)} Boolean if tag is present, `undefined` if tag presence has not been resolved yet.
	 */
	hasExistingTag: createRegistrySelector( ( select ) => () => {
		const existingTag = select( STORE_NAME ).getExistingTag();

		if ( existingTag === undefined ) {
			return undefined;
		}

		return !! existingTag;
	} ),

	/**
	 * Checks whether the user has access to the given tag.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state       Data store's state.
	 * @param {string} containerID Container publicId to check permission for.
	 * @return {(boolean|undefined)} Permission
	 */
	hasTagPermission: createRegistrySelector( ( select ) => ( state, containerID ) => {
		const { permission } = select( STORE_NAME ).getTagPermission( containerID ) || {};

		if ( permission === undefined ) {
			return undefined;
		}

		return !! permission;
	} ),

	/**
	 * Checks whether the user has access to the existing tag, if present.
	 *
	 * @since n.e.x.t
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
			const containerID = select( STORE_NAME ).getExistingTag();

			return select( STORE_NAME ).hasTagPermission( containerID );
		}

		return null;
	} ),
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

export const {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
} = store;

export default store;

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
import { isValidContainerID } from '../util/validation';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createExistingTagStore } from '../../../googlesitekit/data/create-existing-tag-store';
import tagMatchers from '../util/tag-matchers';

const { createRegistrySelector } = Data;

const fetchGetTagPermissionStore = createFetchStore( {
	baseName: 'getTagPermission',
	argsToParams: ( containerID ) => {
		return { containerID };
	},
	validateParams: ( { containerID } = {} ) => {
		invariant( isValidContainerID( containerID ), 'A valid containerID is required to for fetching permission.' );
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

const existingTagStore = createExistingTagStore( {
	storeName: STORE_NAME,
	tagMatchers,
	isValidTag: isValidContainerID,
} );

const baseInitialState = {
	tagPermission: {},
};

const baseResolvers = {
	*getTagPermission( containerID ) {
		if ( ! isValidContainerID( containerID ) ) {
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
	 * Checks permissions for an existing Google Tag Manager container.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} containerID Container publicId to check permission for.
	 * @return {(Object|undefined)} Object with string `accountID` and boolean `permission` properties; `undefined` if not loaded.
	 */
	getTagPermission( state, containerID ) {
		return state.tagPermission[ containerID ];
	},

	/**
	 * Checks whether the user has access to the given tag.
	 *
	 * @since 1.11.0
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
	 * @since 1.11.0
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
	existingTagStore,
	fetchGetTagPermissionStore,
	{
		initialState: baseInitialState,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
} = store;

export default store;

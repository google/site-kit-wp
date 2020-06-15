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
import { getExistingTag } from '../../../util/tag';
import { isValidContainerID } from '../util/validation';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const { createRegistrySelector } = Data;

const fetchGetExistingTagStore = createFetchStore( {
	baseName: 'getExistingTag',
	controlCallback: () => getExistingTag( 'tagmanager' ),
	reducerCallback: ( state, existingTag ) => {
		return {
			...state,
			existingTag,
		};
	},
} );

const fetchGetTagPermissionStore = createFetchStore( {
	baseName: 'getTagPermission',
	argsToParams: ( tag ) => {
		invariant( isValidContainerID( tag ), 'a valid tag is required to for fetching and receiving permission.' );

		return { tag };
	},
	controlCallback: ( { tag } ) => API.get( 'modules', 'tagmanager', 'tag-permission', { tag }, { useCache: false } ),
	reducerCallback: ( state, { permission }, { tag } ) => {
		return {
			...state,
			tagPermission: {
				...state.tagPermission,
				[ tag ]: permission,
			},
		};
	},
} );

const BASE_INITIAL_STATE = {
	existingTag: undefined,
	tagPermission: {},
};

const baseActions = {
	fetchExistingTag: fetchGetExistingTagStore.actions.fetchGetExistingTag,
	fetchTagPermission: fetchGetTagPermissionStore.actions.fetchGetTagPermission,
	receiveExistingTag: fetchGetExistingTagStore.actions.receiveGetExistingTag,
	receiveTagPermission( permission, { tag } ) {
		return fetchGetTagPermissionStore.actions.receiveGetTagPermission( {
			accountID: '',
			containerID: tag,
			permission,
		}, { tag } );
	},
};

const baseResolvers = {
	*getExistingTag() {
		const { select } = yield Data.commonActions.getRegistry();

		if ( select( STORE_NAME ).getExistingTag() === undefined ) {
			yield baseActions.fetchExistingTag();
		}
	},
	*hasTagPermission( tag ) {
		const { select } = yield Data.commonActions.getRegistry();

		if ( select( STORE_NAME ).hasTagPermission( tag ) === undefined ) {
			yield baseActions.fetchTagPermission( tag );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the existing tag, if any.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} The existing tag ID if present, `null` if not present, or `undefined` if not loaded yet.
	 */
	getExistingTag( state ) {
		return state.existingTag;
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
	 * @param {Object} state Data store's state.
	 * @param {string} tag Container publicId to check permission for.
	 * @return {(boolean|undefined)} Permission
	 */
	hasTagPermission( state, tag ) {
		const permission = state.tagPermission[ tag ];

		if ( permission === undefined ) {
			return undefined;
		}

		return !! permission;
	},
	/**
	 * Checks whether the user has access to the existing tag, if present.
	 *
	 * @since n.e.x.t
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
};

const store = Data.combineStores(
	fetchGetExistingTagStore,
	fetchGetTagPermissionStore,
	{
		INITIAL_STATE: BASE_INITIAL_STATE,
		actions: baseActions,
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

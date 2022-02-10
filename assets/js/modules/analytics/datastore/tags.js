/**
 * `modules/analytics` data store: tags.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { MODULES_ANALYTICS } from './constants';
import { isValidPropertyID } from '../util';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createExistingTagStore } from '../../../googlesitekit/data/create-existing-tag-store';
import tagMatchers from '../util/tag-matchers';

const { createRegistryControl } = Data;

const fetchGetTagPermissionStore = createFetchStore( {
	baseName: 'getTagPermission',
	controlCallback: ( { propertyID } ) => {
		return API.get(
			'modules',
			'analytics',
			'tag-permission',
			{ propertyID },
			{
				useCache: false,
			}
		);
	},
	reducerCallback: ( state, { accountID, permission }, { propertyID } ) => {
		return {
			...state,
			tagPermissions: {
				...( state.tagPermissions || {} ),
				[ propertyID ]: { accountID, permission },
			},
		};
	},
	argsToParams: ( propertyID ) => {
		return { propertyID };
	},
	validateParams: ( { propertyID } = {} ) => {
		invariant( propertyID, 'propertyID is required.' );
	},
} );

const existingTagStore = createExistingTagStore( {
	storeName: MODULES_ANALYTICS,
	tagMatchers,
	isValidTag: isValidPropertyID,
} );

// Actions
const WAIT_FOR_TAG_PERMISSION = 'WAIT_FOR_TAG_PERMISSION';

const baseInitialState = {
	tagPermissions: {},
};

const baseActions = {
	waitForTagPermission( propertyID ) {
		return {
			payload: { propertyID },
			type: WAIT_FOR_TAG_PERMISSION,
		};
	},
};

const baseControls = {
	[ WAIT_FOR_TAG_PERMISSION ]: createRegistryControl(
		( registry ) => ( { payload: { propertyID } } ) => {
			// Select first to ensure resolution is always triggered.
			const { getTagPermission, hasFinishedResolution } = registry.select(
				MODULES_ANALYTICS
			);
			getTagPermission( propertyID );
			const isTagPermissionLoaded = () =>
				hasFinishedResolution( 'getTagPermission', [ propertyID ] );
			if ( isTagPermissionLoaded() ) {
				return;
			}
			return new Promise( ( resolve ) => {
				const unsubscribe = registry.subscribe( () => {
					if ( isTagPermissionLoaded() ) {
						unsubscribe();
						resolve();
					}
				} );
			} );
		}
	),
};

const baseResolvers = {
	*getTagPermission( propertyID ) {
		if ( ! isValidPropertyID( propertyID ) ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();

		// If these permissions are already available, don't make a request.
		if (
			registry
				.select( MODULES_ANALYTICS )
				.getTagPermission( propertyID ) !== undefined
		) {
			return;
		}

		yield fetchGetTagPermissionStore.actions.fetchGetTagPermission(
			propertyID
		);
	},
};

const baseSelectors = {
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
	existingTagStore,
	fetchGetTagPermissionStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;

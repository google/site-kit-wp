/**
 * `core/modules` data store: module sharing settings
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { createFetchStore } from '../../data/create-fetch-store';
import { createValidatedAction } from '../../data/utils';

// Actions
const SET_OWNER_ID = 'SET_OWNER_ID';
const SET_SHARING_MANAGEMENT = 'SET_SHARING_MANAGEMENT';
const SET_SHARED_ROLES = 'SET_SHARED_ROLES';
const RECEIVE_GET_SHARING_SETTINGS = 'RECEIVE_GET_SHARING_SETTINGS';

const baseInitialState = {
	sharingSettings: {},
	savedSharingSettings: {},
};

const fetchSaveSharingSettingsStore = createFetchStore( {
	baseName: 'saveSharingSettings',
	controlCallback: ( { savedSharingSettings } ) => {
		return API.set(
			'core',
			'modules',
			'sharing-settings',
			{ savedSharingSettings },
			{
				useCache: false,
			}
		);
	},
	reducerCallback: ( state, { settings } ) => {
		return {
			...state,
			savedSharingSettings: settings,
			sharingSettings: settings,
		};
	},
	argsToParams: ( savedSharingSettings ) => ( { savedSharingSettings } ),
	validateParams: ( { savedSharingSettings } = {} ) => {
		invariant( savedSharingSettings, 'savedSharingSettings is required.' );
	},
} );

const baseActions = {
	/**
	 * Sets ownerID for the given modules.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} newOwnerIDs New owner IDs, [moduleSlug]: Number.
	 * @return {Object} Action for SET_OWNER_ID.
	 */
	setOwnerID( newOwnerIDs ) {
		invariant( newOwnerIDs, 'newOwnerIDs is required.' );
		return {
			payload: {
				newOwnerIDs,
			},
			type: SET_OWNER_ID,
		};
	},

	/**
	 * Sets the sharing settings management role of given module.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} moduleSlug Module slug.
	 * @param {string} management New management role for module, one of: all_admins, owner.
	 * @return {Object} Action for SET_SHARING_MANAGEMENT.
	 */
	setSharingManagement( moduleSlug, management ) {
		invariant( moduleSlug, 'moduleSlug is required.' );
		const managementRoles = [ 'all_admins', 'owner' ];
		invariant(
			managementRoles.includes( management ),
			`management must be one of: ${ managementRoles.join( ', ' ) }.`
		);
		return {
			payload: {
				moduleSlug,
				management,
			},
			type: SET_SHARING_MANAGEMENT,
		};
	},

	/**
	 * Sets the sharing settings management role of given module.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string}   moduleSlug Module slug.
	 * @param {string[]} roles      List of roles the module is shared with.
	 * @return {Object} Action for SET_SHARED_ROLES.
	 */
	setSharedRoles( moduleSlug, roles ) {
		invariant( moduleSlug, 'moduleSlug is required.' );
		invariant(
			Array.isArray( roles ) &&
				roles.every( ( role ) => typeof role === 'string' ),
			'roles must be an array of strings.'
		);
		return {
			payload: {
				moduleSlug,
				roles,
			},
			type: SET_SHARED_ROLES,
		};
	},

	/**
	 * Saves sharingSettings for dashboard sharing.
	 *
	 * Save sharingSettings for dashboard sharing.
	 * Update ownerID from the response for the modules in the sharingSettings state.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} sharingSettings Sharing settings for modules with `management` and `sharedRoles` properties.
	 * @return {Object} Object with `{response, error}`.
	 */
	saveSharingSettings: createValidatedAction(
		( sharingSettings ) => {
			invariant( sharingSettings, 'sharingSettings is required.' );
		},
		function* ( sharingSettings ) {
			const {
				response,
				error,
			} = yield fetchSaveSharingSettingsStore.actions.fetchSaveSharingSettings(
				sharingSettings
			);

			// Update module owner IDs in the sharing settings modules.
			if ( response?.newOwnerIDs ) {
				yield baseActions.setOwnerID( response.newOwnerIDs );
			}

			return { response, error };
		}
	),

	/**
	 * Receives sharingSettings for dashboard sharing.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} sharingSettings Sharing settings for modules with `management` and `sharedRoles` properties.
	 * @return {Object} Action for RECEIVE_GET_SHARING_SETTINGS.
	 */
	receiveGetSharingSettings( sharingSettings ) {
		invariant( sharingSettings, 'sharingSettings is required.' );
		return {
			payload: sharingSettings,
			type: RECEIVE_GET_SHARING_SETTINGS,
		};
	},
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_SHARING_MANAGEMENT: {
			const { moduleSlug, management } = payload;

			return {
				...state,
				sharingSettings: {
					...state.sharingSettings,
					[ moduleSlug ]: {
						...state.sharingSettings[ moduleSlug ],
						management,
					},
				},
				savedSharingSettings: {
					...state.savedSharingSettings,
					[ moduleSlug ]: {
						...state.savedSharingSettings[ moduleSlug ],
						management,
					},
				},
			};
		}

		case SET_SHARED_ROLES: {
			const { moduleSlug, roles } = payload;

			return {
				...state,
				sharingSettings: {
					...state.sharingSettings,
					[ moduleSlug ]: {
						...state.sharingSettings[ moduleSlug ],
						sharedRoles: roles,
					},
				},
				savedSharingSettings: {
					...state.savedSharingSettings,
					[ moduleSlug ]: {
						...state.savedSharingSettings[ moduleSlug ],
						sharedRoles: roles,
					},
				},
			};
		}

		case SET_OWNER_ID: {
			const { newOwnerIDs } = payload;

			const sharingSettingsWithOnwerID = Object.keys(
				newOwnerIDs
			).reduce(
				( modules, moduleSlug ) => ( {
					...modules,
					[ moduleSlug ]: {
						...state.sharingSettings[ moduleSlug ],
						ownerID: newOwnerIDs[ moduleSlug ],
					},
				} ),
				{}
			);

			return {
				...state,
				sharingSettings: {
					...state.sharingSettings,
					...sharingSettingsWithOnwerID,
				},
				savedSharingSettings: {
					...state.savedSharingSettings,
					...sharingSettingsWithOnwerID,
				},
			};
		}

		case RECEIVE_GET_SHARING_SETTINGS: {
			const { sharingSettings } = payload;

			return {
				...state,
				sharingSettings,
				savedSharingSettings: sharingSettings,
			};
		}

		default: {
			return state;
		}
	}
};

const baseSelectors = {};

const store = Data.combineStores( fetchSaveSharingSettingsStore, {
	initialState: baseInitialState,
	actions: baseActions,
	selectors: baseSelectors,
	reducer: baseReducer,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const selectors = store.selectors;
export const reducer = store.reducer;

export default store;

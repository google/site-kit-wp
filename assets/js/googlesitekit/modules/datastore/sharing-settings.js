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
import { isEqual, isEmpty, pick } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createRegistrySelector,
	combineStores,
	wpControls,
} from 'googlesitekit-data';
import { createFetchStore } from '../../data/create-fetch-store';
import { CORE_MODULES } from './constants';
import { createStrictSelect, createValidationSelector } from '../../data/utils';

// Actions
const SET_SHARING_MANAGEMENT = 'SET_SHARING_MANAGEMENT';
const SET_SHARED_ROLES = 'SET_SHARED_ROLES';
const RECEIVE_GET_SHARING_SETTINGS = 'RECEIVE_GET_SHARING_SETTINGS';
const RECEIVE_SHAREABLE_ROLES = 'RECEIVE_SHAREABLE_ROLES';
const START_SUBMIT_SHARING_CHANGES = 'START_SUBMIT_SHARING_CHANGES';
const FINISH_SUBMIT_SHARING_CHANGES = 'FINISH_SUBMIT_SHARING_CHANGES';
const ROLLBACK_SHARING_SETTINGS = 'ROLLBACK_SHARING_SETTINGS';
const RECEIVE_DEFAULT_SHARED_OWNERSHIP_MODULE_SETTINGS =
	'RECEIVE_DEFAULT_SHARED_OWNERSHIP_MODULE_SETTINGS';

// Invariant error messages.
export const INVARIANT_DOING_SUBMIT_SHARING_CHANGES =
	'cannot submit sharing changes while submitting changes';
export const INVARIANT_SHARING_SETTINGS_NOT_CHANGED =
	'cannot submit changes if sharing settings have not changed';

const validManagementValues = [ 'all_admins', 'owner' ];

const baseInitialState = {
	sharingSettings: undefined,
	savedSharingSettings: undefined,
	shareableRoles: undefined,
	isDoingSubmitSharingChanges: undefined,
	defaultSharedOwnershipModuleSettings: undefined,
};

const fetchSaveSharingSettingsStore = createFetchStore( {
	baseName: 'saveSharingSettings',
	controlCallback: ( { savedSharingSettings } ) => {
		return API.set(
			'core',
			'modules',
			'sharing-settings',
			savedSharingSettings
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

const fetchResetSharingSettingsStore = createFetchStore( {
	baseName: 'resetSharingSettings',
	controlCallback: ( {} ) => {
		return API.set(
			'core',
			'modules',
			'sharing-settings',
			{},
			{ method: 'DELETE' }
		);
	},
	reducerCallback: ( state ) => {
		return {
			...state,
			savedSharingSettings: {},
			sharingSettings: {},
		};
	},
} );

const baseActions = {
	/**
	 * Sets the sharing settings management of a given module.
	 *
	 * @since 1.77.0
	 *
	 * @param {string} moduleSlug Module slug.
	 * @param {string} management New management for a module, one of all_admins | owner.
	 * @return {Object} Action for SET_SHARING_MANAGEMENT.
	 */
	setSharingManagement( moduleSlug, management ) {
		invariant( moduleSlug, 'moduleSlug is required.' );

		invariant(
			validManagementValues.includes( management ),
			`management must be one of: ${ validManagementValues.join(
				', '
			) }.`
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
	 * Sets the sharing settings shared roles of a given module.
	 *
	 * @since 1.77.0
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
	 * @since 1.77.0
	 *
	 * @return {Object} Object with `{response, error}`.
	 */
	*saveSharingSettings() {
		yield {
			type: START_SUBMIT_SHARING_CHANGES,
			payload: {},
		};

		const sharingSettings = yield wpControls.select(
			CORE_MODULES,
			'getSharingSettings'
		);

		const { response, error } =
			yield fetchSaveSharingSettingsStore.actions.fetchSaveSharingSettings(
				sharingSettings
			);

		// Update module owner IDs in the sharing settings modules.
		if ( ! error && Object.keys( response.newOwnerIDs ).length ) {
			for ( const [ slug, ownerID ] of Object.entries(
				response.newOwnerIDs
			) ) {
				const storeName = yield wpControls.select(
					CORE_MODULES,
					'getModuleStoreName',
					slug
				);

				yield wpControls.dispatch( storeName, 'setOwnerID', ownerID );
			}
		}

		yield {
			type: FINISH_SUBMIT_SHARING_CHANGES,
			payload: {},
		};

		return { response, error };
	},

	/**
	 * Resets sharingSettings for dashboard sharing.
	 *
	 * Reset sharingSettings for dashboard sharing.
	 *
	 * @since 1.84.0
	 *
	 * @return {Object} Object with `{response, error}`.
	 */
	*resetSharingSettings() {
		yield {
			type: START_SUBMIT_SHARING_CHANGES,
			payload: {},
		};

		const { response, error } =
			yield fetchResetSharingSettingsStore.actions.fetchResetSharingSettings();

		yield {
			type: FINISH_SUBMIT_SHARING_CHANGES,
			payload: {},
		};

		return { response, error };
	},

	/**
	 * Receives sharingSettings for dashboard sharing.
	 * Stores sharingSettings in the datastore.
	 *
	 * Because this is frequently-accessed data, this is usually sourced
	 * from a global variable (`_googlesitekitDashboardSharingData`), set by PHP
	 * in the `before_print` callback for `googlesitekit-datastore-site`.
	 *
	 * @since 1.77.0
	 *
	 * @param {Object} sharingSettings Sharing settings for modules with `management` and `sharedRoles` properties.
	 * @return {Object} Action for RECEIVE_GET_SHARING_SETTINGS.
	 */
	receiveGetSharingSettings( sharingSettings ) {
		invariant( sharingSettings, 'sharingSettings is required.' );
		return {
			payload: { sharingSettings },
			type: RECEIVE_GET_SHARING_SETTINGS,
		};
	},

	/**
	 * Receives shareableRoles for dashboard sharing.
	 * Stores shareableRoles in the datastore.
	 *
	 * Because this is frequently-accessed data, this is usually sourced
	 * from a global variable (`_googlesitekitDashboardSharingData`), set by PHP
	 * in the `before_print` callback for `googlesitekit-datastore-site`.
	 *
	 * @since 1.77.0
	 *
	 * @param {Object} shareableRoles Shareable Roles for modules with `management` and `sharedRoles` properties.
	 * @return {Object} Action for RECEIVE_SHAREABLE_ROLES.
	 */
	receiveShareableRoles( shareableRoles ) {
		invariant( shareableRoles, 'shareableRoles is required.' );
		return {
			payload: { shareableRoles },
			type: RECEIVE_SHAREABLE_ROLES,
		};
	},

	/**
	 * Restores the sharing settings to the currently saved values.
	 *
	 * @since 1.78.0
	 *
	 * @return {Object} Action for ROLLBACK_SHARING_SETTINGS.
	 */
	rollbackSharingSettings() {
		return {
			payload: {},
			type: ROLLBACK_SHARING_SETTINGS,
		};
	},

	/**
	 * Receives defaultSharedOwnershipModuleSettings for dashboard sharing.
	 * Stores defaultSharedOwnershipModuleSettings in the datastore.
	 *
	 * Because this is frequently-accessed data, this is usually sourced
	 * from a global variable (`_googlesitekitDashboardSharingData`), set by PHP
	 * in the `before_print` callback for `googlesitekit-datastore-site`.
	 *
	 * @since 1.85.0
	 *
	 * @param {Object} defaultSharedOwnershipModuleSettings Default sharing settings for the shared ownership modules.
	 * @return {Object} Action for RECEIVE_DEFAULT_SHARED_OWNERSHIP_MODULE_SETTINGS.
	 */
	receiveDefaultSharedOwnershipModuleSettings(
		defaultSharedOwnershipModuleSettings
	) {
		invariant(
			defaultSharedOwnershipModuleSettings,
			'defaultSharedOwnershipModuleSettings is required.'
		);
		return {
			payload: { defaultSharedOwnershipModuleSettings },
			type: RECEIVE_DEFAULT_SHARED_OWNERSHIP_MODULE_SETTINGS,
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

		case RECEIVE_SHAREABLE_ROLES: {
			const { shareableRoles } = payload;

			return {
				...state,
				shareableRoles,
			};
		}

		case START_SUBMIT_SHARING_CHANGES: {
			return {
				...state,
				isDoingSubmitSharingChanges: true,
			};
		}

		case FINISH_SUBMIT_SHARING_CHANGES: {
			return {
				...state,
				isDoingSubmitSharingChanges: false,
			};
		}

		case ROLLBACK_SHARING_SETTINGS: {
			return {
				...state,
				sharingSettings: state.savedSharingSettings,
			};
		}

		case RECEIVE_DEFAULT_SHARED_OWNERSHIP_MODULE_SETTINGS:
			const { defaultSharedOwnershipModuleSettings } = payload;

			return {
				...state,
				defaultSharedOwnershipModuleSettings,
			};

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getSharingSettings() {
		const sharingSettings = yield wpControls.select(
			CORE_MODULES,
			'getSharingSettings'
		);

		if ( sharingSettings ) {
			return;
		}

		if ( ! global._googlesitekitDashboardSharingData ) {
			global.console.error(
				'Could not load core/modules dashboard sharing settings.'
			);
			return;
		}

		const { settings } = global._googlesitekitDashboardSharingData;
		yield actions.receiveGetSharingSettings( settings );
	},

	*getShareableRoles() {
		const shareableRoles = yield wpControls.select(
			CORE_MODULES,
			'getShareableRoles'
		);

		if ( shareableRoles ) {
			return;
		}

		if ( ! global._googlesitekitDashboardSharingData ) {
			global.console.error(
				'Could not load core/modules dashboard sharing roles.'
			);
			return;
		}

		const { roles } = global._googlesitekitDashboardSharingData;
		yield actions.receiveShareableRoles( roles );
	},

	*getDefaultSharedOwnershipModuleSettings() {
		const defaultSharedOwnershipModuleSettingsInStore =
			yield wpControls.select(
				CORE_MODULES,
				'getDefaultSharedOwnershipModuleSettings'
			);

		if ( defaultSharedOwnershipModuleSettingsInStore ) {
			return;
		}

		if ( ! global._googlesitekitDashboardSharingData ) {
			global.console.error(
				'Could not load core/modules dashboard sharing.'
			);
			return;
		}

		const { defaultSharedOwnershipModuleSettings } =
			global._googlesitekitDashboardSharingData;
		yield baseActions.receiveDefaultSharedOwnershipModuleSettings(
			defaultSharedOwnershipModuleSettings
		);
	},
};

function validateCanSubmitSharingChanges( select ) {
	const strictSelect = createStrictSelect( select );
	const { isDoingSubmitSharingChanges, haveSharingSettingsChanged } =
		strictSelect( CORE_MODULES );

	invariant(
		! isDoingSubmitSharingChanges(),
		INVARIANT_DOING_SUBMIT_SHARING_CHANGES
	);
	invariant(
		haveSharingSettingsChanged(),
		INVARIANT_SHARING_SETTINGS_NOT_CHANGED
	);
}

const {
	safeSelector: canSubmitSharingChanges,
	dangerousSelector: __dangerousCanSubmitSharingChanges,
} = createValidationSelector( validateCanSubmitSharingChanges );

const baseSelectors = {
	canSubmitSharingChanges,
	__dangerousCanSubmitSharingChanges,

	/**
	 * Gets the current dashboard sharing settings.
	 *
	 * @since 1.77.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Sharing Settings object. Returns undefined if it is not loaded yet.
	 */
	getSharingSettings( state ) {
		const { sharingSettings } = state;
		return sharingSettings;
	},

	/**
	 * Gets the current dashboard shareable roles.
	 *
	 * @since 1.77.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Shareable Roles object. Returns undefined if it is not loaded yet.
	 */
	getShareableRoles( state ) {
		const { shareableRoles } = state;
		return shareableRoles;
	},

	/**
	 * Gets the dashboard sharing management for the given module.
	 *
	 * Returns the module's sharing management string.
	 *
	 * @since 1.77.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} moduleSlug Module slug.
	 * @return {(string|null|undefined)} The module's sharing management string, null if there is none,
	 *                                   undefined if not loaded yet.
	 */
	getSharingManagement: createRegistrySelector(
		( select ) => ( state, moduleSlug ) => {
			invariant( moduleSlug, 'moduleSlug is required.' );
			const sharingSettings = select( CORE_MODULES ).getSharingSettings();

			if ( sharingSettings === undefined ) {
				return undefined;
			}
			return sharingSettings[ moduleSlug ]?.management || null;
		}
	),

	/**
	 * Gets the shared roles for the given module.
	 *
	 * Returns the module's shared roles list.
	 *
	 * @since 1.77.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} moduleSlug Module slug.
	 * @return {(Array|null|undefined)} The module's shared roles array, null if there is none,
	 *                                   undefined if not loaded yet.
	 */
	getSharedRoles: createRegistrySelector(
		( select ) => ( state, moduleSlug ) => {
			invariant( moduleSlug, 'moduleSlug is required.' );
			const sharingSettings = select( CORE_MODULES ).getSharingSettings();

			if ( sharingSettings === undefined ) {
				return undefined;
			}

			return sharingSettings[ moduleSlug ]?.sharedRoles || null;
		}
	),

	/**
	 * Indicates whether the current sharing settings have changed from what is saved.
	 *
	 * @since 1.77.0
	 *
	 * @param {Object}     state Data store's state.
	 * @param {Array|null} keys  Sharing Settings keys to check; if not provided, all sharing settings are checked.
	 * @return {boolean} True if the sharing settings have changed, false otherwise.
	 */
	haveSharingSettingsChanged( state, keys = null ) {
		const { sharingSettings, savedSharingSettings } = state;

		if ( keys ) {
			return ! isEqual(
				pick( sharingSettings, keys ),
				pick( savedSharingSettings, keys )
			);
		}

		return ! isEqual( sharingSettings, savedSharingSettings );
	},

	/**
	 * Compares current sharing settings management OR sharedRoles have changed from what is saved.
	 *
	 * @since 1.78.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} key   Sharing Settings property key to check; one of `management` | `sharedRoles`.
	 * @return {boolean|undefined} True if the sharing settings have changed, false otherwise, `undefined` if not yet loaded.
	 */
	haveSharingSettingsExpanded( state, key ) {
		const validKeys = [ 'management', 'sharedRoles' ];
		invariant(
			validKeys.includes( key ),
			`key must be one of: ${ validKeys.join( ', ' ) }.`
		);
		const { sharingSettings, savedSharingSettings } = state;

		if (
			sharingSettings === undefined ||
			savedSharingSettings === undefined
		) {
			return undefined;
		}

		// Return `true` if the management setting for any module has been
		// changed from `owner` to `all_admins`.
		if ( key === 'management' ) {
			return Object.keys( sharingSettings ).some( ( moduleSlug ) => {
				const hasInitialManagementChanged =
					savedSharingSettings[ moduleSlug ]?.management !==
					sharingSettings[ moduleSlug ]?.management;

				return (
					hasInitialManagementChanged &&
					sharingSettings[ moduleSlug ]?.management === 'all_admins'
				);
			} );
		}

		// Return `true` if sharing settings for any module contain roles
		// that haven't been previously selected.
		if ( key === 'sharedRoles' ) {
			return Object.keys( sharingSettings ).some( ( moduleSlug ) => {
				return (
					sharingSettings[ moduleSlug ]?.sharedRoles?.filter(
						( currentRole ) =>
							! savedSharingSettings[
								moduleSlug
							]?.sharedRoles?.includes( currentRole )
					).length > 0
				);
			} );
		}

		return false;
	},

	/**
	 * Indicates whether the current sharing settings have changed from what is saved for the given module.
	 *
	 * @since 1.80.0
	 *
	 * @param {Object}     state      Data store's state.
	 * @param {string}     moduleSlug Module slug.
	 * @param {Array|null} keys       Sharing Settings keys to check; if not provided, all sharing settings are checked.
	 * @return {boolean|undefined} True if the given module's sharing settings have changed; false otherwise; `undefined` if not yet loaded.
	 */
	haveModuleSharingSettingsChanged( state, moduleSlug, keys = null ) {
		invariant( moduleSlug, 'moduleSlug is required.' );

		const { sharingSettings, savedSharingSettings } = state;

		if (
			sharingSettings === undefined ||
			savedSharingSettings === undefined
		) {
			return undefined;
		}

		if ( keys ) {
			return ! isEqual(
				pick( sharingSettings[ moduleSlug ], keys ),
				pick( savedSharingSettings[ moduleSlug ], keys )
			);
		}

		return ! isEqual(
			sharingSettings[ moduleSlug ],
			savedSharingSettings[ moduleSlug ]
		);
	},

	/**
	 * Checks whether sharing settings changes are currently being submitted.
	 *
	 * @since 1.77.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if submitting, otherwise FALSE.
	 */
	isDoingSubmitSharingChanges( state ) {
		return !! state.isDoingSubmitSharingChanges;
	},

	/**
	 * Gets the default sharing settings for shared ownership modules.
	 *
	 * @since 1.85.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Sharing Settings object. Returns undefined if it is not loaded yet.
	 */
	getDefaultSharedOwnershipModuleSettings( state ) {
		const { defaultSharedOwnershipModuleSettings } = state;
		return defaultSharedOwnershipModuleSettings;
	},

	/**
	 * Indicates whether the sharing settings have updated from default.
	 *
	 * @since 1.85.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if the sharing settings have updated, false otherwise.
	 */
	haveSharingSettingsUpdated( state ) {
		const { savedSharingSettings, sharedOwnershipModules } = state;

		if (
			isEmpty( savedSharingSettings ) ||
			isEmpty( sharedOwnershipModules )
		) {
			return false;
		}

		return Object.keys( savedSharingSettings ).some( ( moduleSlug ) => {
			const { sharedRoles, management } =
				savedSharingSettings[ moduleSlug ];

			const isSharedOwnershipModule =
				sharedOwnershipModules.includes( moduleSlug );

			const defaultManagement = isSharedOwnershipModule
				? 'all_admins'
				: 'owner';

			return sharedRoles.length > 0 || management !== defaultManagement;
		} );
	},
};

const store = combineStores(
	fetchSaveSharingSettingsStore,
	fetchResetSharingSettingsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		selectors: baseSelectors,
		reducer: baseReducer,
		resolvers: baseResolvers,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const selectors = store.selectors;
export const reducer = store.reducer;

export default store;

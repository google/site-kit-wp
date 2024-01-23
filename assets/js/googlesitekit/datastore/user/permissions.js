/**
 * `core/user` data store: permission scopes.
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
import { CORE_USER, PERMISSION_READ_SHARED_MODULE_DATA } from './constants';
import { CORE_MODULES } from '../../modules/datastore/constants';
import { getMetaCapabilityPropertyName } from '../util/permissions';
import { createFetchStore } from '../../data/create-fetch-store';
const { createRegistrySelector } = Data;

// Actions
const CLEAR_PERMISSION_SCOPE_ERROR = 'CLEAR_PERMISSION_SCOPE_ERROR';
const SET_PERMISSION_SCOPE_ERROR = 'SET_PERMISSION_SCOPE_ERROR';
const RECEIVE_CAPABILITIES = 'RECEIVE_CAPABILITIES';

const fetchGetCapabilitiesStore = createFetchStore( {
	baseName: 'getCapabilities',
	controlCallback: () => {
		return API.get( 'core', 'user', 'permissions', undefined, {
			useCache: false,
		} );
	},
	reducerCallback: ( state, capabilities ) => ( {
		...state,
		capabilities,
	} ),
} );

const baseInitialState = {
	permissionError: null,
	capabilities: undefined,
};

const baseActions = {
	/**
	 * Clears the permission scope error, if one was previously set.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @return {Object} Redux-style action.
	 */
	clearPermissionScopeError() {
		return {
			payload: {},
			type: CLEAR_PERMISSION_SCOPE_ERROR,
		};
	},

	/**
	 * Sets a permission error encountered by an API request.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {Object} permissionError Permissions error object.
	 * @return {Object} Redux-style action.
	 */
	setPermissionScopeError( permissionError ) {
		invariant( permissionError, 'permissionError is required.' );

		return {
			payload: { permissionError },
			type: SET_PERMISSION_SCOPE_ERROR,
		};
	},

	/**
	 * Sets user capabilities.
	 *
	 * @since 1.13.0
	 * @private
	 *
	 * @param {Object} capabilities User capabilities.
	 * @return {Object} Redux-style action.
	 */
	receiveCapabilities( capabilities ) {
		return {
			type: RECEIVE_CAPABILITIES,
			payload: { capabilities },
		};
	},

	/**
	 * Refreshes user capabilities.
	 *
	 * @since 1.82.0
	 *
	 * @return {Object} Redux-style action.
	 */
	*refreshCapabilities() {
		const { dispatch } = yield Data.commonActions.getRegistry();

		const { response, error } =
			yield fetchGetCapabilitiesStore.actions.fetchGetCapabilities();

		if ( error ) {
			dispatch( CORE_USER ).setPermissionScopeError( error );
		}

		return { response, error };
	},
};

const baseControls = {};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case CLEAR_PERMISSION_SCOPE_ERROR: {
			return {
				...state,
				permissionError: null,
			};
		}

		case SET_PERMISSION_SCOPE_ERROR: {
			const { permissionError } = payload;

			return {
				...state,
				permissionError,
			};
		}

		case RECEIVE_CAPABILITIES: {
			const { capabilities } = payload;

			return {
				...state,
				capabilities,
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getCapabilities() {
		const registry = yield Data.commonActions.getRegistry();

		if ( registry.select( CORE_USER ).getCapabilities() ) {
			return;
		}

		// Temporary hack to preserve previous behavior when resolved from global.
		// This is necessary for now to avoid a delay if the preloaded data
		// has already expired.
		// We'll still fetch it in case something has changed,
		// but receive the preloaded right away.
		const preloadedPermissions =
			global._googlesitekitAPIFetchData?.preloadedData?.[
				'/google-site-kit/v1/core/user/data/permissions'
			]?.body;

		if ( preloadedPermissions ) {
			yield fetchGetCapabilitiesStore.actions.receiveGetCapabilities( {
				...preloadedPermissions, // dereference.
			} );
		}

		yield fetchGetCapabilitiesStore.actions.fetchGetCapabilities();
	},
};

const baseSelectors = {
	/**
	 * Gets the most recent permission error encountered by this user.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|null)} Permission scope errors. Returns `null` if no error exists.
	 */
	getPermissionScopeError( state ) {
		const { permissionError } = state;
		return permissionError;
	},

	/**
	 * Gets capabilities of the current user.
	 *
	 * @since 1.13.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Capabilities object. Returns undefined if it is not loaded yet.
	 */
	getCapabilities( state ) {
		const { capabilities } = state;
		return capabilities;
	},

	/**
	 * Gets viewable module slugs of the current user.
	 *
	 * @since 1.72.0
	 * @since 1.101.0 Filters out the duplicate module slugs if the user has both ‘analytics’ and ‘analytics-4’ and shows only one based on whether the user is viewing the GA4 dashboard.
	 *
	 * @return {(Array|undefined)} An array of viewable module slugs. `undefined` if `modules` are not loaded yet.
	 */
	getViewableModules: createRegistrySelector( ( select ) => () => {
		const modules = select( CORE_MODULES ).getModules();

		if ( modules === undefined ) {
			return undefined;
		}

		// Return an array of module slugs for modules that are
		// shareable and the user has the "read shared module data"
		// capability for.
		return Object.values( modules ).reduce( ( slugs, module ) => {
			if ( module.slug === 'analytics' ) {
				return slugs;
			}

			const hasCapability = select( CORE_USER ).hasCapability(
				PERMISSION_READ_SHARED_MODULE_DATA,
				module.slug
			);

			if ( module.shareable && hasCapability ) {
				return [ ...slugs, module.slug ];
			}

			return slugs;
		}, [] );
	} ),

	/**
	 * Checks if the current user has the specified capability or not.
	 *
	 * @since 1.13.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} capability Capability name to check.
	 * @param {Array}  args       List of rest of the arguments. Specifically one or many module slugs.
	 * @return {(boolean|undefined)} TRUE if the current user has this capability, otherwise FALSE. If capabilities ain't loaded yet, returns undefined.
	 */
	hasCapability: createRegistrySelector(
		( select ) =>
			( state, capability, ...args ) => {
				const capabilities = select( CORE_USER ).getCapabilities();

				if ( args.length > 0 ) {
					capability = getMetaCapabilityPropertyName(
						capability,
						...args
					);
				}

				if ( capabilities ) {
					return !! capabilities[ capability ];
				}

				return undefined;
			}
	),

	/**
	 * Checks if the specified module is shareable and viewable by the current user.
	 *
	 * @since 1.77.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} moduleSlug Module slug to check.
	 * @return {(boolean|undefined)} `true` if the module is shareable and viewable by the current user. `false` if the module does not exist, is not shareable or not viewable by the current user. `undefined` if state is not loaded yet.
	 */
	canViewSharedModule: createRegistrySelector(
		( select ) => ( state, moduleSlug ) => {
			const module = select( CORE_MODULES ).getModule( moduleSlug );

			if ( module === undefined ) {
				return undefined;
			}

			if ( module === null || ! module.shareable ) {
				return false;
			}

			let capabilityModuleSlug = module.slug;
			if ( capabilityModuleSlug === 'analytics' ) {
				capabilityModuleSlug = 'analytics-4';
			}

			return select( CORE_USER ).hasCapability(
				PERMISSION_READ_SHARED_MODULE_DATA,
				capabilityModuleSlug
			);
		}
	),

	/**
	 * Checks if the current user has access to the specified shareable module.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} moduleSlug Module slug to check.
	 * @return {boolean} `true` if the user is authenticated or if the module is shareable and viewable by the current user. `false` if the module does not exist, is not shareable or not viewable by the current user.
	 */
	hasAccessToShareableModule: createRegistrySelector(
		( select ) => ( state, moduleSlug ) => {
			if ( ! select( CORE_MODULES ).isModuleAvailable( moduleSlug ) ) {
				return false;
			}

			if ( select( CORE_USER ).isAuthenticated() ) {
				return true;
			}

			return select( CORE_USER ).canViewSharedModule( moduleSlug );
		}
	),
};

const store = Data.combineStores( fetchGetCapabilitiesStore, {
	initialState: baseInitialState,
	actions: baseActions,
	controls: baseControls,
	reducer: baseReducer,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;

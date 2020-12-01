/**
 * `core/modules` data store: module info.
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
import memize from 'memize';
import defaults from 'lodash/defaults';
import merge from 'lodash/merge';
import isPlainObject from 'lodash/isPlainObject';
import invariant from 'invariant';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * WordPress dependencies
 */
import { WPComponent } from '@wordpress/element';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME, ERROR_CODE_INSUFFICIENT_MODULE_DEPENDENCIES } from './constants';
import { STORE_NAME as CORE_SITE } from '../../datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../datastore/user/constants';
import { createFetchStore } from '../../data/create-fetch-store';
import { getLocale } from '../../../util';

const { createRegistrySelector, createRegistryControl } = Data;

// Actions.
const REFETCH_AUTHENTICATION = 'REFETCH_AUTHENTICATION';
const SELECT_MODULE_REAUTH_URL = 'SELECT_MODULE_REAUTH_URL';
const REGISTER_MODULE = 'REGISTER_MODULE';
const RECEIVE_CHECK_REQUIREMENTS_ERROR = 'RECEIVE_CHECK_REQUIREMENTS_ERROR';
const RECEIVE_CHECK_REQUIREMENTS_SUCCESS = 'RECEIVE_CHECK_REQUIREMENTS_SUCCESS';

const moduleDefaults = {
	slug: '',
	name: '',
	description: '',
	homepage: null,
	internal: false,
	active: false,
	connected: false,
	dependencies: [],
	dependants: [],
	order: 10,
	icon: null,
	settingsEditComponent: null,
	settingsViewComponent: null,
	setupComponent: null,
};

const normalizeModules = memize(
	( modules ) => Object.keys( modules )
		.map( ( slug ) => {
			const module = { ...modules[ slug ], slug };
			// Fill any `undefined` values with defaults.
			defaults( module, { name: slug }, moduleDefaults );

			return module;
		} )
		.sort( ( a, b ) => a.order - b.order )
		.reduce( ( acc, module ) => {
			return { ...acc, [ module.slug ]: module };
		}, {} )
);

const fetchGetModulesStore = createFetchStore( {
	baseName: 'getModules',
	controlCallback: () => {
		return API.get( 'core', 'modules', 'list', null, {
			useCache: false,
		} );
	},
	reducerCallback: ( state, modules ) => {
		return {
			...state,
			isAwaitingModulesRefresh: false,
			serverDefinitions: modules.reduce( ( acc, module ) => {
				return { ...acc, [ module.slug ]: module };
			}, {} ),
		};
	},
} );

const fetchSetModuleActivationStore = createFetchStore( {
	baseName: 'setModuleActivation',
	controlCallback: ( { slug, active } ) => {
		return API.set( 'core', 'modules', 'activation', {
			slug,
			active,
		} );
	},
	reducerCallback: ( state ) => {
		// Updated module activation state is handled by re-fetching module
		// data instead, so this reducer just sets the below flag.
		return {
			...state,
			isAwaitingModulesRefresh: true,
		};
	},
	argsToParams: ( slug, active ) => {
		return {
			slug,
			active,
		};
	},
	validateParams: ( { slug, active } = {} ) => {
		invariant( slug, 'slug is required.' );
		invariant( active !== undefined, 'active is required.' );
	},
} );

const baseInitialState = {
	clientDefinitions: {},
	serverDefinitions: undefined,
	// This value is to indicate that modules data needs to be refreshed after
	// a module activation update, since the activation is technically complete
	// before this data has been refreshed.
	isAwaitingModulesRefresh: false,
	checkRequirementsResults: {},
};

const baseActions = {
	/**
	 * Activates a module on the server.
	 *
	 * Activate a module (based on the slug provided).
	 *
	 * @since 1.8.0
	 *
	 * @param {string} slug Slug of the module to activate.
	 * @return {Object} Object with `{response, error}`. On success, `response.moduleReauthURL`
	 *                  is set to redirect the user to the corresponding module setup or OAuth
	 *                  consent screen.
	 */
	*activateModule( slug ) {
		const { response, error } = yield baseActions.setModuleActivation( slug, true );

		if ( response?.success === true ) {
			const moduleReauthURL = yield {
				payload: { slug },
				type: SELECT_MODULE_REAUTH_URL,
			};
			return {
				response: { ...response, moduleReauthURL },
				error,
			};
		}

		return { response, error };
	},

	/**
	 * Deactivates a module on the server.
	 *
	 * Deactivate a module (based on the slug provided).
	 *
	 * @since 1.8.0
	 *
	 * @param {string} slug Slug of the module to activate.
	 * @return {Object}      Object with `{response, error}`.
	 */
	*deactivateModule( slug ) {
		const { response, error } = yield baseActions.setModuleActivation( slug, false );

		return { response, error };
	},

	/**
	 * (De)activates a module on the server.
	 *
	 * POSTs to the `core/modules/activation` endpoint to set the `active` status
	 * supplied for the give `slug`.
	 *
	 * @since 1.8.0
	 * @private
	 *
	 * @param {string}  slug   Slug of the module to activate/deactivate.
	 * @param {boolean} active `true` to activate; `false` to deactivate.
	 * @return {Object}         Object with `{response, error}`.
	 */
	*setModuleActivation( slug, active ) {
		invariant( slug, 'slug is required.' );
		invariant( active !== undefined, 'active is required.' );

		const { response, error } = yield fetchSetModuleActivationStore.actions.fetchSetModuleActivation( slug, active );
		if ( response?.success === true ) {
			// Fetch (or re-fetch) all modules, with their updated status.
			yield fetchGetModulesStore.actions.fetchGetModules();
			yield {
				payload: {},
				type: REFETCH_AUTHENTICATION,
			};
		}

		return { response, error };
	},

	/**
	 * Registers a module.
	 *
	 * @since 1.13.0
	 * @since 1.20.0  Introduced the ability to register settings and setup components.
	 * @since n.e.x.t Introduced the ability to add a checkRequirements function.
	 *
	 * @param {string}      slug                             Module slug.
	 * @param {Object}      [settings]                       Optional. Module settings.
	 * @param {string}      [settings.name]                  Optional. Module name. Default is the slug.
	 * @param {string}      [settings.description]           Optional. Module description. Default empty string.
	 * @param {WPComponent} [settings.icon]                  Optional. React component to render module icon. Default none.
	 * @param {number}      [settings.order]                 Optional. Numeric indicator for module order. Default 10.
	 * @param {string}      [settings.homepage]              Optional. Module homepage URL. Default empty string.
	 * @param {WPComponent} [settings.settingsEditComponent] Optional. React component to render the settings edit panel. Default none.
	 * @param {WPComponent} [settings.settingsViewComponent] Optional. React component to render the settings view panel. Default none.
	 * @param {WPComponent} [settings.setupComponent]        Optional. React component to render the setup panel. Default none.
	 * @param {Function}    [settings.checkRequirements]     Optional. Function to check requirements for the module. Throws a WP error object for error or returns on success.
	 */
	*registerModule( slug, {
		name,
		description,
		icon,
		order,
		homepage,
		settingsEditComponent,
		settingsViewComponent,
		setupComponent,
		checkRequirements = () => true,
	} = {} ) {
		invariant( slug, 'module slug is required' );

		const settings = {
			name,
			description,
			icon,
			order,
			homepage,
			settingsEditComponent,
			settingsViewComponent,
			setupComponent,
			checkRequirements,
		};

		yield {
			payload: {
				settings,
				slug,
			},
			type: REGISTER_MODULE,
		};

		const registry = yield Data.commonActions.getRegistry();

		// As we can specify a custom checkRequirements function here, we're invalidating the resolvers for activation checks.
		yield registry.dispatch( STORE_NAME ).invalidateResolution( 'canActivateModule', [ slug ] );
		yield registry.dispatch( STORE_NAME ).invalidateResolution( 'getCheckRequirementsError', [ slug ] );
	},

	/**
	 * Receives the check requirements error map for specified modules modules.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string} slug  Module slug.
	 * @param {Object} error WordPress Error object containing code, message and data properties.
	 * @return {Object} Action for RECEIVE_CHECK_REQUIREMENTS_ERROR.
	 */
	receiveCheckRequirementsError( slug, error ) {
		invariant( slug, 'slug is required' );
		invariant( isPlainObject( error ), 'error is required and must be an object' );
		return {
			payload: { slug, error },
			type: RECEIVE_CHECK_REQUIREMENTS_ERROR,
		};
	},

	/**
	 * Receives the check requirements success for a module.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string} slug Success for a module slug.
	 * @return {Object} Action for RECEIVE_CHECK_REQUIREMENTS_SUCCESS.
	 */
	receiveCheckRequirementsSuccess( slug ) {
		invariant( slug, 'slug is required' );
		return {
			payload: {
				slug,
			},
			type: RECEIVE_CHECK_REQUIREMENTS_SUCCESS,
		};
	},

};

export const baseControls = {
	[ REFETCH_AUTHENTICATION ]: createRegistryControl( ( { dispatch } ) => () => {
		return dispatch( CORE_USER ).fetchGetAuthentication();
	} ),
	[ SELECT_MODULE_REAUTH_URL ]: createRegistryControl( ( { select } ) => ( { payload } ) => {
		const { slug } = payload;
		const getAdminReauthURL = select( `modules/${ slug }` )?.getAdminReauthURL;
		if ( getAdminReauthURL ) {
			return getAdminReauthURL();
		}
		return select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' );
	} ),
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case REGISTER_MODULE: {
			const { slug, settings } = payload;

			if ( !! state.clientDefinitions[ slug ] ) {
				global.console.warn( `Could not register module with slug "${ slug }". Module "${ slug }" is already registered.` );
				return state;
			}

			return {
				...state,
				clientDefinitions: {
					...state.clientDefinitions,
					[ slug ]: settings,
				},
			};
		}

		case RECEIVE_CHECK_REQUIREMENTS_ERROR: {
			const { slug, error } = payload;

			return {
				...state,
				checkRequirementsResults: {
					...state.checkRequirementsResults,
					[ slug ]: error,
				},
			};
		}

		case RECEIVE_CHECK_REQUIREMENTS_SUCCESS: {
			const { slug } = payload;
			return {
				...state,
				checkRequirementsResults: {
					...state.checkRequirementsResults,
					[ slug ]: true,
				},
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getModules() {
		const registry = yield Data.commonActions.getRegistry();

		const existingModules = registry.select( STORE_NAME ).getModules();

		if ( ! existingModules ) {
			yield fetchGetModulesStore.actions.fetchGetModules();
		}
	},

	*canActivateModule( slug ) {
		const registry = yield Data.commonActions.getRegistry();
		yield Data.commonActions.await( registry.__experimentalResolveSelect( STORE_NAME ).getModules() );
		const module = registry.select( STORE_NAME ).getModule( slug );

		if ( ! module ) {
			return;
		}

		const inactiveModules = [];

		module.dependencies.forEach( ( dependencySlug ) => {
			const dependedentModule = registry.select( STORE_NAME ).getModule( dependencySlug );
			if ( ! dependedentModule?.active ) {
				inactiveModules.push( dependedentModule.name );
			}
		} );

		// If we have inactive dependencies, there's no need to check if we can
		// activate the module until the dependencies have been activated.
		if ( inactiveModules.length ) {
			const formatter = new Intl.ListFormat( getLocale(), { style: 'long', type: 'conjunction' } );

			/* translators: Error message text. 1: A flattened list of module names. 2: A module name. */
			const errorMessage = sprintf( __( 'You need to set up %1$s to gain access to %2$s.', 'google-site-kit' ), formatter.format( inactiveModules ), module.name );

			yield baseActions.receiveCheckRequirementsError( slug, {
				code: ERROR_CODE_INSUFFICIENT_MODULE_DEPENDENCIES,
				message: errorMessage,
				data: { inactiveModules },
			} );
		} else {
			try {
				yield Data.commonActions.await( module.checkRequirements() );
				yield baseActions.receiveCheckRequirementsSuccess( slug );
			} catch ( error ) {
				yield baseActions.receiveCheckRequirementsError( slug, error );
			}
		}
	},
};
// Use the canActivateModule resolver for getCheckRequirementsError
baseResolvers.getCheckRequirementsError = baseResolvers.canActivateModule;

const baseSelectors = {
	/**
	 * Gets the list of modules registered for use with Site Kit.
	 *
	 * A module is a section of Site Kit that relates to a particular service,
	 * like Google Analytics or Google PageSpeed modules. They can provide
	 * admin-only features (like PageSpeed Insights), frontend-only features,
	 * or both (eg. Analytics, which can install Analytics <script> tags in the
	 * frontend, and show dashboards in the WordPress Admin).
	 *
	 * Returns an Object/map of objects, keyed by slug, with the following shape when successful:
	 * ```
	 * slug: {
	 *   "slug": "tagmanager",
	 *   "name": "Tag Manager",
	 *   "description": "Tag Manager creates an easy to manage way to create tags on your site without updating code.",
	 *   "homepage": "https://tagmanager.google.com/",
	 *   "internal": false,
	 *   "active": false,
	 *   "connected": false,
	 *   "dependencies": [
	 *     "analytics"
	 *   ],
	 *   "dependents": []
	 * }
	 * ```
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Modules available on the site.
	 */
	getModules( state ) {
		const { clientDefinitions, serverDefinitions } = state;

		// Return `undefined` if modules haven't been loaded yet.
		if ( serverDefinitions === undefined ) {
			return undefined;
		}

		// Module properties in `clientDefinitions` will overwrite `serverDefinitions`
		// but only for keys whose values are not `undefined`.
		const modules = merge( {}, serverDefinitions, clientDefinitions );

		return normalizeModules( modules );
	},

	/**
	 * Gets a specific module by slug.
	 *
	 * Returns a specific module by its slug.
	 * Returns `undefined` if state is still loading or if said module doesn't exist.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {(Object|undefined)} A specific module object; `undefined` if state is still loading or if said module doesn't exist.
	 */
	getModule: createRegistrySelector( ( select ) => ( state, slug ) => {
		const modules = select( STORE_NAME ).getModules();

		// Return `undefined` if modules haven't been loaded yet.
		if ( modules === undefined ) {
			return undefined;
		}

		// A module with this slug couldn't be found; return `null` to signify the
		// "not found" state.
		if ( modules[ slug ] === undefined ) {
			return null;
		}

		// This module exists, so let's return it.
		return modules[ slug ];
	} ),

	/**
	 * Gets a specific module icon by slug.
	 *
	 * Returns a specific module icon by its slug.
	 * Returns `null` if state is still loading or if said module doesn't exist or doesn't have an icon.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {(WPComponent|undefined|null)} A specific module's icon; `undefined` if state is still loading; `null` if said module doesn't exist or doesn't have an icon.
	 */
	getModuleIcon: createRegistrySelector( ( select ) => ( state, slug ) => {
		const module = select( STORE_NAME ).getModule( slug );
		// Return `undefined` if module with this slug isn't loaded yet.
		if ( module === undefined ) {
			return undefined;
		}

		// A module with this slug couldn't be found or the icon is not found for the module; return `null` to signify the
		// "module not found" or "icon not found" state
		if ( module === null || module.icon === null ) {
			return null;
		}

		// This module and the icon exists, so let's return it.
		return module.icon;
	} ),

	/**
	 * Gets module dependency names by slug.
	 *
	 * Returns a list of modules that depend on this module.
	 * Returns `undefined` if state is still loading or if said module doesn't exist.
	 *
	 * @since 1.20.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {(Array|undefined)} An array of dependency module names; `undefined` if state is still loading.
	 */
	getModuleDependencyNames: createRegistrySelector( ( select ) => ( state, slug ) => {
		const module = select( STORE_NAME ).getModule( slug );

		// Return `undefined` if module with this slug isn't loaded yet.
		if ( module === undefined ) {
			return undefined;
		}

		// A module with this slug couldn't be found; return `[]` to signify the
		// "not found" state.
		if ( module === null ) {
			return [];
		}

		// Module is found, return the names of the dependencies
		// Modules are already resolved after we getModule() so they can't be undefined.
		const modules = select( STORE_NAME ).getModules();
		return module.dependencies.map( ( dependencySlug ) => modules[ dependencySlug ]?.name || dependencySlug );
	} ),

	/**
	 * Gets module dependant names by slug.
	 *
	 * Returns a list of modules on which this module depends.
	 * Returns `undefined` if state is still loading or if said module doesn't exist.
	 *
	 * @since 1.20.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {(Array|undefined)} An array of dependant module names; `undefined` if state is still loading.
	 */
	getModuleDependantNames: createRegistrySelector( ( select ) => ( state, slug ) => {
		const module = select( STORE_NAME ).getModule( slug );

		// Return `undefined` if module with this slug isn't loaded yet.
		if ( module === undefined ) {
			return undefined;
		}

		// A module with this slug couldn't be found; return `[]` to signify the
		// "not found" state.
		if ( module === null ) {
			return [];
		}

		// Module is found, return the names of the dependants
		// Modules are already resolved after we getModule() so they can't be undefined.
		const modules = select( STORE_NAME ).getModules();
		return module.dependants.map( ( dependantSlug ) => modules[ dependantSlug ]?.name || dependantSlug );
	} ),

	/**
	 * Checks a module's activation status.
	 *
	 * Returns `true` if the module exists and is active.
	 * Returns `false` if the module exists but is not active.
	 * Returns `undefined` if state is still loading or if no module with that slug exists.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {(boolean|null|undefined)} TRUE when the module exists and is active; `undefined` if state is still loading or `null` if said module doesn't exist.
	 */
	isModuleActive: createRegistrySelector( ( select ) => ( state, slug ) => {
		const module = select( STORE_NAME ).getModule( slug );

		// Return `undefined` if modules haven't been loaded yet.
		if ( module === undefined ) {
			return undefined;
		}

		// A module with this slug couldn't be found; return `null` to signify the
		// "not found" state.
		if ( module === null ) {
			return null;
		}

		return module.active;
	} ),

	/**
	 * Checks whether a module is connected or not.
	 *
	 * Returns `true` if the module exists, is active and connected.
	 * Returns `false` if the module exists but is either not active or not connected.
	 * Returns `undefined` if state is still loading or if no module with that slug exists.
	 *
	 * @since 1.16.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {(boolean|null|undefined)} TRUE when the module exists, is active and connected, otherwise FALSE; `undefined` if state is still loading or `null` if said module doesn't exist.
	 */
	isModuleConnected: createRegistrySelector( ( select ) => ( state, slug ) => {
		const module = select( STORE_NAME ).getModule( slug );

		// Return `undefined` if modules haven't been loaded yet.
		if ( module === undefined ) {
			return undefined;
		}

		// A module with this slug couldn't be found; return `null` to signify the
		// "not found" state.
		if ( module === null ) {
			return null;
		}

		return module.active && module.connected;
	} ),

	/**
	 * Checks if a module's status is changing.
	 *
	 * Returns `true` if the module exists and is changing its `active` flag.
	 * Returns `false` if the module exists but is not changing its `active` flag.
	 * Returns `undefined` if state is still loading or if no module with that slug exists.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {(boolean|undefined)} Activation change status; `undefined` if state is still loading or if no module with that slug exists.
	 */
	isDoingSetModuleActivation: createRegistrySelector( ( select ) => ( state, slug ) => {
		// Return undefined if modules not loaded or invalid slug.
		if ( ! select( STORE_NAME ).getModule( slug ) ) {
			return undefined;
		}

		// Check if the module is being activated.
		if ( select( STORE_NAME ).isFetchingSetModuleActivation( slug, true ) ) {
			return true;
		}

		// Check if the module is being deactivated.
		if ( select( STORE_NAME ).isFetchingSetModuleActivation( slug, false ) ) {
			return true;
		}

		// Check if modules data still needs to be refreshed after activation
		// update.
		return state.isAwaitingModulesRefresh;
	} ),

	/**
	 * Checks if we can activate a module with a given slug.
	 *
	 * Returns `true` if the module can be activated.
	 * Returns `false` if the module can not be activated.
	 * Returns `undefined` if slug can not be found in state.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {(boolean|undefined)} Can activate module status; `undefined` if state is still loading or if no module with that slug exists.
	 */
	canActivateModule( state, slug ) {
		invariant( slug, 'slug is required' );
		const moduleRequirements = state.checkRequirementsResults[ slug ];

		if ( moduleRequirements === undefined ) {
			return undefined;
		}

		return moduleRequirements === true;
	},

	/**
	 * Gets the module activation error for a given slug.
	 *
	 * Returns `null` if the module can be activated and there is no error.
	 * Returns `object` containing code, message and optional data property if there is an activation error for a slug.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {(null|Object)} Activation error for a module slug; `null` if there is no error or an error object if we cannot activate a given module.
	 */
	getCheckRequirementsError( state, slug ) {
		invariant( slug, 'slug is required.' );
		const requirementsStatus = state.checkRequirementsResults[ slug ];
		return requirementsStatus === true ? null : requirementsStatus;
	},
};

const store = Data.combineStores(
	fetchGetModulesStore,
	fetchSetModuleActivationStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
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

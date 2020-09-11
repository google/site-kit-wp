/**
 * core/modules data store: module info.
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
 * WordPress dependencies
 */
import { WPElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME, SETTINGS_DISPLAY_MODES } from './constants';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../datastore/user/constants';
import { createFetchStore } from '../../data/create-fetch-store';
import DefaultModuleSettings from '../components/DefaultModuleSettings';
import { sortByProperty } from '../../../util/sort-by-property';
import { convertArrayListToKeyedObjectMap } from '../../../util/convert-array-to-keyed-object-map';

const { commonActions, createRegistrySelector, createRegistryControl } = Data;

/**
 * Store our module components by registry, then by module `slug`. We do this because
 * we can't store React components in our data store.
 *
 * @private
 * @since 1.13.0
 */
export const ModuleComponents = {};

// Helpers.
function isSettingsMode( ...modes ) {
	return createRegistrySelector( ( select ) => ( state, slug ) => modes.includes( select( STORE_NAME ).getSettingsDisplayMode( slug ) ) );
}

// Actions.
const REFETCH_AUTHENTICATION = 'REFETCH_AUTHENTICATION';
const SET_SETTINGS_COMPONENT = 'SET_SETTINGS_COMPONENT';
const SET_SETTINGS_DISPLAY_MODE = 'SET_SETTINGS_DISPLAY_MODE';
const REGISTER_MODULE = 'REGISTER_MODULE';
const WAIT_FOR_MODULES = 'WAIT_FOR_MODULES';

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
			modules: modules.reduce( ( acc, module ) => {
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

const BASE_INITIAL_STATE = {
	modules: undefined,
	// This value is to indicate that modules data needs to be refreshed after
	// a module activation update, since the activation is technically complete
	// before this data has been refreshed.
	isAwaitingModulesRefresh: false,
};

const baseActions = {
	/**
	 * Wait for the modules to be loaded
	 *
	 * @since 1.13.0
	 *
	 * @return {Object} Redux-style action.
	 */
	waitForModules() {
		return {
			payload: {},
			type: WAIT_FOR_MODULES,
		};
	},
	/**
	 * Activates a module on the server.
	 *
	 * Activate a module (based on the slug provided).
	 *
	 * @since 1.8.0
	 *
	 * @param {string} slug Slug of the module to activate.
	 * @return {Object}      Object with {response, error}
	 */
	*activateModule( slug ) {
		const { response, error } = yield baseActions.setModuleActivation( slug, true );

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
	 * @return {Object}      Object with {response, error}
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
	 * @return {Object}         Object with {response, error}
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
	 *
	 * @param {string}    slug                         Module slug.
	 * @param {Object}    [settings]                   Optional. Module settings.
	 * @param {string}    [settings.name]              Optional. Module name. Default is the slug.
	 * @param {string}    [settings.description]       Optional. Module description. Default empty string.
	 * @param {string}    [settings.icon]              Optional. Module icon. Default empty string.
	 * @param {number}    [settings.order]             Optional. Numeric indicator for module order. Default 10.
	 * @param {string}    [settings.homepage]          Optional. Module homepage URL. Default empty string.
	 * @param {WPElement} [settings.settingsComponent] React component to render the settings panel. Default is the DefaultModuleSettings component.
	 * @return {Object} Generator instance.
	 */
	registerModule( slug, {
		name = slug,
		description = null,
		icon = null,
		order = 10,
		homepage = null,
		settingsComponent = DefaultModuleSettings,
	} = {} ) {
		invariant( slug, 'module slug is required' );

		return ( function* () {
			yield actions.waitForModules();
			const { select } = yield commonActions.getRegistry();
			const registryKey = select( CORE_SITE ).getRegistryKey();

			// We do this assignment in the action rather than the reducer because we can't send a
			// payload that includes a React component to the reducer; we'll get an error about
			// payloads needing to be plain objects.
			if ( ModuleComponents[ registryKey ] === undefined ) {
				ModuleComponents[ registryKey ] = {};
			}

			if ( ModuleComponents[ registryKey ][ slug ] === undefined ) {
				ModuleComponents[ registryKey ][ slug ] = settingsComponent;
			}

			const settings = {
				name,
				description,
				icon,
				order,
				homepage,
			};

			return {
				payload: {
					slug,
					settings,
				},
				type: REGISTER_MODULE,
			};
		}() );
	},

	/**
	 * Sets settings component for a module.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} slug                 Module slug.
	 * @param {WPElement} settingsComponent React component to render the settings panel. Default is the DefaultModuleSettings component.
	 * @return {Object} Redux-style action.
	 */
	*setSettingsComponent( slug, settingsComponent ) {
		invariant( slug, 'module slug is required' );

		const registry = yield commonActions.getRegistry();
		yield actions.waitForModules();
		const registryKey = registry.select( CORE_SITE ).getRegistryKey();

		// We do this assignment in the action rather than the reducer because we can't send a
		// payload that includes a React component to the reducer; we'll get an error about
		// payloads needing to be plain objects.
		if ( ModuleComponents[ registryKey ] === undefined ) {
			ModuleComponents[ registryKey ] = {};
		}

		if ( ModuleComponents[ registryKey ][ slug ] === undefined ) {
			ModuleComponents[ registryKey ][ slug ] = settingsComponent;
		}

		return {
			payload: { slug },
			type: SET_SETTINGS_COMPONENT,
		};
	},

	/**
	 * Set settings display mode for the module identified by slug.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} slug   Module slug.
	 * @param {string} status The settings status, one of: "closed", "view", "edit", "locked" or "saving".
	 * @return {Object} Redux-style action.
	 */
	*setSettingsDisplayMode( slug, status ) {
		invariant( slug, 'slug is required.' );
		invariant( Object.values( SETTINGS_DISPLAY_MODES ).includes( status ), 'status is one of "closed", "view", "edit", "locked" or "saving".' );

		yield actions.waitForModules();

		return {
			payload: { slug, status },
			type: SET_SETTINGS_DISPLAY_MODE,
		};
	},
};

export const baseControls = {
	[ REFETCH_AUTHENTICATION ]: createRegistryControl( ( { dispatch } ) => () => {
		return dispatch( CORE_USER ).fetchGetAuthentication();
	} ),
	[ WAIT_FOR_MODULES ]: createRegistryControl( ( registry ) => ( { payload: {} } ) => {
		// Select first to ensure resolution is always triggered.
		const { getModules, hasFinishedResolution } = registry.select( STORE_NAME );
		getModules();
		const modulesAreLoaded = () => hasFinishedResolution( 'getModules', [] );
		if ( modulesAreLoaded() ) {
			return;
		}
		return new Promise( ( resolve ) => {
			const unsubscribe = registry.subscribe( () => {
				if ( modulesAreLoaded() ) {
					unsubscribe();
					resolve();
				}
			} );
		} );
	} ),
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case REGISTER_MODULE: {
			const { slug, settings } = payload;

			return {
				...state,
				modules: {
					...state.modules,
					[ slug ]: {
						...( state.modules?.[ slug ] || {} ),
						...settings,
						...{ slug },
					},
				},
			};
		}
		case SET_SETTINGS_COMPONENT: {
			return {
				...state,
			};
		}
		case SET_SETTINGS_DISPLAY_MODE: {
			const { slug, status } = payload;
			const { modules: existingModules } = state;

			// Clone object so as not to override previous object's values below.
			const updatedModules = JSON.parse( JSON.stringify( existingModules ) );

			// If status is "view", set all other modules to "closed".
			if ( status === SETTINGS_DISPLAY_MODES.VIEW ) {
				Object.keys( updatedModules ).forEach( ( currentSlug ) => {
					if ( updatedModules[ currentSlug ] !== slug ) {
						updatedModules[ currentSlug ].displayMode = SETTINGS_DISPLAY_MODES.CLOSED;
					}
				} );
			}

			// If status is "edit", set all other modules to "locked".
			if ( status === SETTINGS_DISPLAY_MODES.EDIT ) {
				Object.keys( updatedModules ).forEach( ( currentSlug ) => {
					if ( updatedModules[ currentSlug ] !== slug ) {
						updatedModules[ currentSlug ].displayMode = SETTINGS_DISPLAY_MODES.LOCKED;
					}
				} );
			}

			return {
				...state,
				modules: {
					...updatedModules,
					[ slug ]: {
						...updatedModules[ slug ],
						displayMode: status,
					},
				},
			};
		}

		default: {
			return { ...state };
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
};

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
	getModules: createRegistrySelector( ( select ) => ( state ) => {
		const { modules } = state;

		// Return `undefined` if modules haven't been loaded yet.
		if ( modules === undefined ) {
			return undefined;
		}

		const registryKey = select( CORE_SITE ).getRegistryKey();
		if ( registryKey === undefined ) {
			return undefined;
		}

		// Sorting the modules object by order property.
		const sortedModules = sortByProperty( Object.values( modules ), 'order' );
		const mappedModules = sortedModules.map( ( module ) => {
			const moduleWithComponent = { ...module };

			// If there is a settingsComponent that was passed use it, otherwise set to the default.
			if ( ModuleComponents[ registryKey ] && ModuleComponents[ registryKey ][ module.slug ] ) {
				moduleWithComponent.settingsComponent = ModuleComponents[ registryKey ][ module.slug ];
			} else {
				moduleWithComponent.settingsComponent = undefined;
			}

			return moduleWithComponent;
		} );

		return convertArrayListToKeyedObjectMap( mappedModules, 'slug' );
	} ),

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
	 * Gets the display mode for module's settings.
	 *
	 * Returns one of: "view", "edit", "saving", "closed" or "locked".
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {string} The displayMode status of the module identified by the slug, default 'closed'.
	 */
	getSettingsDisplayMode: createRegistrySelector( ( select ) => ( state, slug ) => {
		const modules = select( STORE_NAME ).getModules();

		// Return `undefined` if modules haven't been loaded yet.
		if ( modules === undefined ) {
			return SETTINGS_DISPLAY_MODES.CLOSED;
		}

		return modules[ slug ]?.displayMode || SETTINGS_DISPLAY_MODES.CLOSED;
	} ),

	/**
	 * Checks if a module's settings are being edited.
	 *
	 * Returns `true` if the module exists and is being edited.
	 * Returns `false` if the module doesn't exist or is not being edited.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {boolean} True if module exists and settings are being edited, false if not.
	 */
	isEditingSettings: isSettingsMode( SETTINGS_DISPLAY_MODES.EDIT ),

	/**
	 * Checks if a module's settings are open.
	 *
	 * Returns `true` if the module exists and its settings are open.
	 * Returns `false` if the module doesn't exist or its settings aren't open.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {boolean} True if module exists and settings are open, false if not.
	 */
	isSettingsOpen: isSettingsMode( SETTINGS_DISPLAY_MODES.VIEW, SETTINGS_DISPLAY_MODES.EDIT, SETTINGS_DISPLAY_MODES.SAVING ),

	/**
	 * Checks if a module's settings are being saved.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {boolean} True if module exists and settings are open, false if not.
	 */
	isSavingSettings: isSettingsMode( SETTINGS_DISPLAY_MODES.SAVING ),

	/**
	 * Gets a module slug that has open settigns (with either open, view or saving state).
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {string|undefined} Module slug if there is a module with open settings, otherwise undefined.
	 */
	getModuleSlugWithActiveSettings: createRegistrySelector( ( select ) => () => {
		const modules = select( STORE_NAME ).getModules();
		const openModes = [
			SETTINGS_DISPLAY_MODES.EDIT,
			SETTINGS_DISPLAY_MODES.VIEW,
			SETTINGS_DISPLAY_MODES.SAVING,
		];

		return ( modules ? Object.values( modules ) : [] ).find( ( { displayMode } ) => openModes.includes( displayMode ) )?.slug;
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
};

const store = Data.combineStores(
	fetchGetModulesStore,
	fetchSetModuleActivationStore,
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

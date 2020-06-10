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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import DefaultModuleSettings from '../components/DefaultModuleSettings';

const { createRegistrySelector } = Data;

// Actions
const START_FETCH_SET_MODULE_ACTIVATION = 'START_FETCH_SET_MODULE_ACTIVATION';
const FETCH_SET_MODULE_ACTIVATION = 'FETCH_SET_MODULE_ACTIVATION';
const FINISH_FETCH_SET_MODULE_ACTIVATION = 'FINISH_FETCH_SET_MODULE_ACTIVATION';
const CATCH_FETCH_SET_MODULE_ACTIVATION = 'CATCH_FETCH_SET_MODULE_ACTIVATION';
const START_FETCH_MODULES = 'START_FETCH_MODULES';
const FETCH_MODULES = 'FETCH_MODULES';
const FINISH_FETCH_MODULES = 'FINISH_FETCH_MODULES';
const CATCH_FETCH_MODULES = 'CATCH_FETCH_MODULES';
const RECEIVE_MODULES = 'RECEIVE_MODULES';
const REGISTER_MODULE = 'REGISTER_MODULE';

export const INITIAL_STATE = {
	modules: undefined,
	isFetchingSetModuleActivation: {},
	isFetchingModules: false,
};

export const actions = {
	/**
	 * Activate a module on the server.
	 *
	 * Activate a module (based on the slug provided).
	 *
	 * @since 1.8.0
	 *
	 * @param {string} slug Slug of the module to activate.
	 * @return {Object}      Object with {response, error}
	 */
	*activateModule( slug ) {
		const { response, error } = yield actions.setModuleActivation( slug, true );
		return { response, error };
	},

	/**
	 * Dectivate a module on the server.
	 *
	 * Dectivate a module (based on the slug provided).
	 *
	 * @since 1.8.0
	 *
	 * @param {string} slug Slug of the module to activate.
	 * @return {Object}      Object with {response, error}
	 */
	*deactivateModule( slug ) {
		const { response, error } = yield actions.setModuleActivation( slug, false );
		return { response, error };
	},

	/**
	 * (De)activate a module on the server.
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

		let response, error;

		const params = { active, slug };

		yield {
			payload: { params },
			type: START_FETCH_SET_MODULE_ACTIVATION,
		};

		try {
			response = yield {
				payload: { params },
				type: FETCH_SET_MODULE_ACTIVATION,
			};

			if ( response.success === true ) {
				// Fetch (or re-fetch) all modules, with their updated status.
				yield actions.fetchModules();
			}

			yield {
				payload: { params },
				type: FINISH_FETCH_SET_MODULE_ACTIVATION,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: { params, error },
				type: CATCH_FETCH_SET_MODULE_ACTIVATION,
			};
		}

		return { response, error };
	},

	/**
	 * Dispatches an action that creates an HTTP request.
	 *
	 * Requests the `core/modules/list` endpoint.
	 *
	 * @since 1.8.0
	 * @private
	 *
	 * @return {Object} Object with {response, error}
	 */
	*fetchModules() {
		let response, error;

		yield {
			payload: {},
			type: START_FETCH_MODULES,
		};

		try {
			response = yield {
				payload: {},
				type: FETCH_MODULES,
			};

			yield actions.receiveModules( response );

			yield {
				payload: {},
				type: FINISH_FETCH_MODULES,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: { error },
				type: CATCH_FETCH_MODULES,
			};
		}

		return { response, error };
	},

	/**
	 * Stores modules received from the REST API.
	 *
	 * @since 1.5.0
	 * @private
	 *
	 * @param {Array} modules Modules from the API.
	 * @return {Object} Redux-style action.
	 */
	receiveModules( modules ) {
		invariant( modules, 'modules is required.' );

		return {
			payload: { modules },
			type: RECEIVE_MODULES,
		};
	},

	/**
	 * @param {string}          slug                         Module slug.
	 * @param {Object}          settings                     Module settings.
	 * @param {string}          [settings.name]              Optional. Module name. Default is the slug.
	 * @param {string}          [settings.description]       Optional. Module description. Default empty string.
	 * @param {string}          [settings.icon]              Optional. Module icon. Default empty string.
	 * @param {number}          [settings.order]             Optional. Numeric indicator for module order. Default 10.
	 * @param {string}          [settings.homepage]          Optional. Module homepage URL. Default empty string.
	 * @param {boolean}         [settings.internal]          Optional. Whether the module is considered internal. Default false.
	 * @param {React.Component} [settings.settingsComponent] React component to render the settings panel. Default is the DefaultModuleSettings component.
	 * @return {Object} Redux-style action.
	 */
	registerModule( slug, settings = {} ) {
		invariant( slug, 'module slug is required' );

		const mergedModuleSettings = {
			name: slug,
			description: null,
			icon: null,
			order: 10,
			homepage: null,
			internal: false,
			settingsComponent: DefaultModuleSettings,
			...settings,
		};

		return {
			payload: { slug, settings: mergedModuleSettings },
			type: REGISTER_MODULE,
		};
	},
};

export const controls = {
	[ FETCH_SET_MODULE_ACTIVATION ]: ( { payload: { params } } ) => {
		return API.set( 'core', 'modules', 'activation', params );
	},
	[ FETCH_MODULES ]: () => {
		return API.get( 'core', 'modules', 'list', null, { useCache: false } );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_FETCH_SET_MODULE_ACTIVATION: {
			const { slug } = payload.params;

			return {
				...state,
				isFetchingSetModuleActivation: {
					...state.isFetchingSetModuleActivation,
					[ slug ]: true,
				},
			};
		}

		case FINISH_FETCH_SET_MODULE_ACTIVATION: {
			const { slug } = payload.params;

			return {
				...state,
				isFetchingSetModuleActivation: {
					...state.isFetchingSetModuleActivation,
					[ slug ]: false,
				},
			};
		}

		case CATCH_FETCH_SET_MODULE_ACTIVATION: {
			const { slug } = payload.params;

			return {
				...state,
				error: payload.error,
				isFetchingSetModuleActivation: {
					...state.isFetchingSetModuleActivation,
					[ slug ]: false,
				},
			};
		}

		case START_FETCH_MODULES: {
			return {
				...state,
				isFetchingModules: true,
			};
		}

		case RECEIVE_MODULES: {
			const { modules } = payload;

			return {
				...state,
				modules: modules.reduce( ( acc, module ) => {
					return { ...acc, [ module.slug ]: module };
				}, {} ),
			};
		}

		case FINISH_FETCH_MODULES: {
			return {
				...state,
				isFetchingModules: false,
			};
		}

		case CATCH_FETCH_MODULES: {
			return {
				...state,
				error: payload.error,
				isFetchingModules: false,
			};
		}

		case REGISTER_MODULE: {
			const { modules: existingModules } = state;
			const { slug, settings } = payload;
			return {
				...state,
				modules: {
					...existingModules,
					[ slug ]: settings,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getModules() {
		const registry = yield Data.commonActions.getRegistry();

		const existingModules = registry.select( STORE_NAME ).getModules();

		if ( ! existingModules ) {
			yield actions.fetchModules();
		}
	},
};

export const selectors = {
	/**
	 * Get the list of modules registered for use with Site Kit.
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
	 *   "dependants": []
	 * }
	 * ```
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Modules available on the site.
	 */
	getModules( state ) {
		const { modules } = state;

		return modules;
	},

	/**
	 * Get a specific module by slug.
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
	 * Check a module's activation status.
	 *
	 * Returns `true` if the module exists and is active.
	 * Returns `false` if the module exists but is not active.
	 * Returns `undefined` if state is still loading or if no module with that slug exists.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {(Object|undefined)} A specific module object; `undefined` if state is still loading or if said module doesn't exist.
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
	 * Check if a module's status is changing.
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
	isSettingModuleActivation: ( state, slug ) => {
		return state.isFetchingSetModuleActivation[ slug ];
	},
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

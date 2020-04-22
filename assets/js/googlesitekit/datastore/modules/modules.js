/**
 * core/site data store: connection info.
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

const { createRegistrySelector } = Data;

// Actions
const START_FETCH_MODULES = 'START_FETCH_MODULES';
const FETCH_MODULES = 'FETCH_MODULES';
const FINISH_FETCH_MODULES = 'FINISH_FETCH_MODULES';
const CATCH_FETCH_MODULES = 'CATCH_FETCH_MODULES';
const RECEIVE_MODULES = 'RECEIVE_MODULES';

export const INITIAL_STATE = {
	modules: undefined,
	isFetchingModules: false,
};

export const actions = {
	/**
	 * Dispatches an action that creates an HTTP request.
	 *
	 * Requests the `core/modules/list` endpoint.
	 *
	 * @since n.e.x.t
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
};

export const controls = {
	[ FETCH_MODULES ]: () => {
		return API.get( 'core', 'modules', 'list' );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
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
	 * Returns a hash of objects with the shape, keyed by slug, when successful:
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
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} Modules available on the site.
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
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} A specific module object.
	 */
	getModule: createRegistrySelector( ( select ) => ( state, slug ) => {
		const modules = select( STORE_NAME ).getModules() || {};

		return modules[ slug ];
	} ),

	/**
	 * Check a module's activation status.
	 *
	 * Returns `true` if the module exists and is active.
	 * Returns `false` if the module exists but is not active.
	 * Returns `undefined` if state is still loading or if no module with that slug exists.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} A specific module object.
	 */
	isModuleActive: createRegistrySelector( ( select ) => ( state, slug ) => {
		const module = select( STORE_NAME ).getModule( slug );

		if ( typeof module === 'undefined' ) {
			return undefined;
		}

		return module.active;
	} ),
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

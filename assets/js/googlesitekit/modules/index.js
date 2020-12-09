/**
 * Modules API.
 *
 * Provides API functions to manage modules.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { createModuleStore } from './create-module-store';
import { STORE_NAME } from './datastore/constants';
// This import has a side-effect: it automatically registers the "core/modules"
// store on `googlesitekit.data`.
import './datastore';

const Modules = {
	createModuleStore,
	/**
	 * Activates a module on the server.
	 *
	 * Activate a module (based on the slug provided).
	 *
	 * @since 1.8.0
	 *
	 * @param {any}    args      Module action arguments.
	 * @param {string} args.slug Slug of the module to activate.
	 * @return {Promise} The dispatched action.
	 */
	activateModule: ( ...args ) => {
		return Data.dispatch( STORE_NAME ).activateModule( ...args );
	},
	/**
	 * Deactivates a module on the server.
	 *
	 * Deactivate a module (based on the slug provided).
	 *
	 * @since 1.8.0
	 *
	 * @param {any}    args      Module action arguments.
	 * @param {string} args.slug Slug of the module to activate.
	 * @return {Promise} The dispatched action.
	 */
	deactivateModule: ( ...args ) => {
		return Data.dispatch( STORE_NAME ).deactivateModule( ...args );
	},
	/**
	 * Registers a module.
	 *
	 * @since 1.13.0
	 * @since 1.20.0 Introduced the ability to register settings and setup components.
	 * @since 1.22.0 Introduced the ability to add a checkRequirements function.
	 *
	 * @param {Object}      args                         Module action arguments.
	 * @param {string}      args.slug                    Module slug.
	 * @param {string}      [args.name]                  Optional. Module name. Default is the slug.
	 * @param {string}      [args.description]           Optional. Module description. Default empty string.
	 * @param {string}      [args.icon]                  Optional. Module icon. Default empty string.
	 * @param {number}      [args.order]                 Optional. Numeric indicator for module order. Default 10.
	 * @param {string}      [args.homepage]              Optional. Module homepage URL. Default empty string.
	 * @param {WPComponent} [args.settingsEditComponent] Optional. React component to render the settings edit panel. Default none.
	 * @param {WPComponent} [args.settingsViewComponent] Optional. React component to render the settings view panel. Default none.
	 * @param {WPComponent} [args.setupComponent]        Optional. React component to render the setup panel. Default none.
	 * @param {Function}    [args.checkRequirements]     Optional. Function to check requirements for the module. Throws a WP error object for error or returns on success.
	 * @return {Promise} The dispatched action.
	 */
	registerModule: ( ...args ) => {
		return Data.dispatch( STORE_NAME ).registerModule( ...args );
	},
};

export default Modules;

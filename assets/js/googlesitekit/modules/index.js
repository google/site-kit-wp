/**
 * Modules API.
 *
 * Provides API functions to manage modules.
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
 * Internal dependencies
 */
import { createModuleStore } from './create-module-store';
import { STORE_NAME } from './datastore/constants';

export { registerStore } from './datastore';

/**
 * Creates a new instance of Modules.
 *
 * @since 1.26.0
 *
 * @param {Object}   registry          Datastore registry.
 * @param {Function} registry.dispatch Registry dispatch function.
 * @return {Object} Modules instance.
 */
export function createModules( { dispatch } ) {
	const Modules = {
		createModuleStore,
		/**
		 * Activates a module on the server.
		 *
		 * Activate a module (based on the slug provided).
		 *
		 * @since 1.8.0
		 *
		 * @param {string} slug Slug of the module to activate.
		 * @return {Promise} The dispatched action.
		 */
		activateModule: ( slug ) => {
			return dispatch( STORE_NAME ).activateModule( slug );
		},
		/**
		 * Deactivates a module on the server.
		 *
		 * Deactivate a module (based on the slug provided).
		 *
		 * @since 1.8.0
		 *
		 * @param {string} slug Slug of the module to activate.
		 * @return {Promise} The dispatched action.
		 */
		deactivateModule: ( slug ) => {
			return dispatch( STORE_NAME ).deactivateModule( slug );
		},
		/**
		 * Registers a module.
		 *
		 * @since 1.13.0
		 * @since 1.20.0 Introduced the ability to register settings and setup components.
		 * @since 1.22.0 Introduced the ability to add a checkRequirements function.
		 * @since 1.23.0 Introduced the ability to register an Icon component.
		 * @since n.e.x.t Introduced a registry parameter for checkRequirements.
		 *
		 * @param {string}      slug                             Module slug.
		 * @param {Object}      [settings]                       Optional. Module settings.
		 * @param {string}      [settings.name]                  Optional. Module name. Default is the slug.
		 * @param {string}      [settings.description]           Optional. Module description. Default empty string.
		 * @param {WPComponent} [settings.Icon]                  Optional. React component to render module icon. Default none.
		 * @param {number}      [settings.order]                 Optional. Numeric indicator for module order. Default 10.
		 * @param {string}      [settings.homepage]              Optional. Module homepage URL. Default empty string.
		 * @param {WPComponent} [settings.SettingsEditComponent] Optional. React component to render the settings edit panel. Default none.
		 * @param {WPComponent} [settings.SettingsViewComponent] Optional. React component to render the settings view panel. Default none.
		 * @param {WPComponent} [settings.SetupComponent]        Optional. React component to render the setup panel. Default none.
		 * @return {Promise} The dispatched action.
		 */
		registerModule: ( slug, settings ) => {
			return dispatch( STORE_NAME ).registerModule( slug, settings );
		},
	};

	return Modules;
}

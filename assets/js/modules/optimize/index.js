/**
 * Optimize module initialization.
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
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import './datastore';
import OptimizeSetup from './setup/setup';
import { fillFilterWithComponent, getModulesData } from '../../util';

const slug = 'optimize';
const modulesData = getModulesData();
if ( modulesData.optimize.active ) {
	/**
	 * Add components to the settings page.
	 */
	addFilter(
		`googlesitekit.ModuleSettingsDetails-${ slug }`,
		'googlesitekit.OptimizeModuleSettingsDetails',
		fillFilterWithComponent( OptimizeSetup, {
			onSettingsPage: true,
		} )
	);

	/**
	 * Add component to the setup wizard
	 */
	addFilter(
		`googlesitekit.ModuleSetup-${ slug }`,
		'googlesitekit.OptimizeModuleSetupWizard',
		fillFilterWithComponent( OptimizeSetup, {
			onSettingsPage: false,
		} )
	);
}

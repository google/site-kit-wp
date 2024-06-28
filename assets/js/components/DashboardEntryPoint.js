/**
 * DashboardEntryPoint component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ModuleSetup from './setup/ModuleSetup';
import DashboardMainApp from './DashboardMainApp';
// import ModuleRootComponents from './ModuleRootComponents';

export default function DashboardEntryPoint( { setupModuleSlug } ) {
	return (
		<Fragment>
			{ /* <ModuleRootComponents dashboardType="main" /> */ }
			{ !! setupModuleSlug ? (
				<ModuleSetup moduleSlug={ setupModuleSlug } />
			) : (
				<DashboardMainApp />
			) }
		</Fragment>
	);
}

DashboardEntryPoint.propTypes = {
	setupModuleSlug: PropTypes.string,
};

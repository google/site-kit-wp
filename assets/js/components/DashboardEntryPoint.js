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
 * WordPress dependencies
 */
import { useMount } from 'react-use';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ModuleSetup from './setup/ModuleSetup';
import DashboardMainApp from './DashboardMainApp';
import { useDispatch } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../modules/analytics-4/datastore/constants';

export default function DashboardEntryPoint( { setupModuleSlug } ) {
	const ga4Actions = useDispatch( MODULES_ANALYTICS_4 );

	useMount( () => {
		// @TODO investigate if it is possible to move this action
		// into module specific hooks.
		ga4Actions?.syncGoogleTagSettings();
	} );

	if ( !! setupModuleSlug ) {
		return <ModuleSetup moduleSlug={ setupModuleSlug } />;
	}

	return <DashboardMainApp />;
}

DashboardEntryPoint.propTypes = {
	setupModuleSlug: PropTypes.string,
};

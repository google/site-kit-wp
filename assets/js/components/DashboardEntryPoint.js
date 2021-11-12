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
import { useFeature } from '../hooks/useFeature';
import ModuleSetup from './setup/ModuleSetup';
import DashboardApp from './dashboard/DashboardApp';
import DashboardMainApp from './DashboardMainApp';
import NotificationCounter from './legacy-notifications/notification-counter';

export default function DashboardEntryPoint( { setupModuleSlug } ) {
	const unifiedDashboardEnabled = useFeature( 'unifiedDashboard' );

	if ( !! setupModuleSlug ) {
		return <ModuleSetup moduleSlug={ setupModuleSlug } />;
	}

	if ( unifiedDashboardEnabled ) {
		return <DashboardMainApp />;
	}

	return (
		<Fragment>
			<NotificationCounter />
			<DashboardApp />
		</Fragment>
	);
}

DashboardEntryPoint.propTypes = {
	setupModuleSlug: PropTypes.string,
};

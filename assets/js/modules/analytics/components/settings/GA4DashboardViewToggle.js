/**
 * GA4 Dashboard View Toggle component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Switch } from 'googlesitekit-components';
import {
	DASHBOARD_VIEW_GA4,
	DASHBOARD_VIEW_UA,
	MODULES_ANALYTICS,
} from '../../datastore/constants';
import { trackEvent } from '../../../../util';
import useViewContext from '../../../../hooks/useViewContext';
const { useSelect, useDispatch } = Data;

export default function GA4DashboardViewToggle( {
	isUAConnected = false,
	isUAEnabled = false,
} ) {
	const viewContext = useViewContext();

	const dashboardView = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getDashboardView()
	);
	const { setDashboardView } = useDispatch( MODULES_ANALYTICS );

	const onChange = useCallback( () => {
		const newDashboardView =
			dashboardView === DASHBOARD_VIEW_GA4
				? DASHBOARD_VIEW_UA
				: DASHBOARD_VIEW_GA4;

		setDashboardView( newDashboardView );
		trackEvent(
			`${ viewContext }_analytics`,
			newDashboardView === DASHBOARD_VIEW_GA4
				? 'set_dashboard_view_to_ga4'
				: 'set_dashboard_view_to_ua'
		);
	}, [ dashboardView, setDashboardView, viewContext ] );

	const displayDashboardView =
		isUAConnected && isUAEnabled ? dashboardView : DASHBOARD_VIEW_GA4;

	return (
		<div>
			<Switch
				label={ __(
					'Display metrics from Google Analytics 4 on the dashboard',
					'google-site-kit'
				) }
				checked={ displayDashboardView === DASHBOARD_VIEW_GA4 }
				onClick={ onChange }
				hideLabel={ false }
				disabled={ ! ( isUAConnected && isUAEnabled ) }
			/>
			<p>
				{ displayDashboardView === DASHBOARD_VIEW_GA4 &&
					__(
						'Site Kit will show data from Google Analytics 4 (the new version of Analytics) on your dashboard',
						'google-site-kit'
					) }
				{ displayDashboardView === DASHBOARD_VIEW_UA &&
					__(
						'Site Kit will show data from Universal Analytics (the old version of Analytics) on your dashboard',
						'google-site-kit'
					) }
			</p>
		</div>
	);
}

// eslint-disable-next-line sitekit/acronym-case
GA4DashboardViewToggle.propTypes = {
	isUAConnected: PropTypes.bool,
	isUAEnabled: PropTypes.bool,
};

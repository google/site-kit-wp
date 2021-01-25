/**
 * WPDashboardApp component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Link from '../Link';
import LegacyWPDashboardModules from './LegacyWPDashboardModules';
import WPDashboardImpressions from './WPDashboardImpressions';
import WPDashboardClicks from './WPDashboardClicks';
import WPDashboardUniqueVisitors from './WPDashboardUniqueVisitors';
import WPDashboardSessionDuration from './WPDashboardSessionDuration';
import WPDashboardPopularPages from './WPDashboardPopularPages';
import ActivateModuleCTA from '../ActivateModuleCTA';
import CompleteModuleActivationCTA from '../CompleteModuleActivationCTA';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { useFeature } from '../../hooks/useFeature';
const { useSelect } = Data;

const WPDashboardApp = () => {
	const widgetsWPDashboardEnabled = useFeature( 'widgets.wpDashboard' );
	const dashboardURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' ) );
	const analyticsModuleActive = useSelect( ( select ) => select( CORE_MODULES ).isModuleActive( 'analytics' ) );
	const analyticsModuleConnected = useSelect( ( select ) => select( CORE_MODULES ).isModuleConnected( 'analytics' ) );

	if ( dashboardURL === undefined ) {
		return null;
	}

	return (
		<div className="googlesitekit-wp-dashboard">
			<div className="googlesitekit-wp-dashboard__cta">
				<Link className="googlesitekit-wp-dashboard__cta-link" href={ dashboardURL }>
					{ __( 'Visit your Site Kit Dashboard', 'google-site-kit' ) }
				</Link>
			</div>
			{ widgetsWPDashboardEnabled && (
				<div className={ classnames(
					'googlesitekit-wp-dashboard-stats',
					{ 'googlesitekit-wp-dashboard-stats--fourup': analyticsModuleActive && analyticsModuleConnected }
				) }>
					{ analyticsModuleActive && analyticsModuleConnected && (
						<Fragment>
							<WPDashboardUniqueVisitors />
							<WPDashboardSessionDuration />
						</Fragment>
					) }
					<WPDashboardImpressions />
					<WPDashboardClicks />
					{ ( ! analyticsModuleConnected || ! analyticsModuleActive ) && (
						<div className="googlesitekit-wp-dashboard-stats__cta">
							{ ! analyticsModuleActive && (
								<ActivateModuleCTA moduleSlug="analytics" />
							) }
							{ analyticsModuleActive && (
								<CompleteModuleActivationCTA moduleSlug="analytics" />
							) }
						</div>
					) }
					<WPDashboardPopularPages />
				</div>
			) }
			<LegacyWPDashboardModules />
		</div>
	);
};

export default WPDashboardApp;

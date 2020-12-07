/**
 * WPDashboardApp component.
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
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Link from '../Link';
import LegacyWPDashboardModules from './legacy-wp-dashboard-modules';
import WPDashboardImpressions from './wp-dashboard-impressions';
import WPDashboardClicks from './wp-dashboard-clicks';
import WPDashboardUniqueVisitors from './wp-dashboard-unique-visitors';
import WPDashboardSessionDuration from './wp-dashboard-session-duration';
import AnalyticsInactiveCTA from '../AnalyticsInactiveCTA';
import { STORE_NAME as CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
const { useSelect } = Data;

const WPDashboardApp = () => {
	const dashboardURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' ) );
	const analyticsModuleActive = useSelect( ( select ) => select( CORE_MODULES ).isModuleActive( 'analytics' ) );
	const analyticsModuleConnected = useSelect( ( select ) => select( CORE_MODULES ).isModuleConnected( 'analytics' ) );

	if ( ! dashboardURL ) {
		return null;
	}

	return (
		<div className="googlesitekit-wp-dashboard">
			<div className="googlesitekit-wp-dashboard__cta">
				<Link className="googlesitekit-wp-dashboard__cta-link" href={ dashboardURL }>
					{ __( 'Visit your Site Kit Dashboard', 'google-site-kit' ) }
				</Link>
			</div>
			<div className="googlesitekit-wp-dashboard-stats googlesitekit-wp-dashboard-stats--fourup">
				{ featureFlags.widgets.wpDashboard.enabled && (
					<Fragment>
						<WPDashboardImpressions />
						<WPDashboardClicks />
						{ analyticsModuleActive && analyticsModuleConnected && (
							<Fragment>
								<WPDashboardUniqueVisitors />
								<WPDashboardSessionDuration />
							</Fragment>
						) }
						{ ( ! analyticsModuleActive || ! analyticsModuleConnected ) && <AnalyticsInactiveCTA /> }
					</Fragment>
				) }
			</div>
			<LegacyWPDashboardModules />
		</div>
	);
};

export default WPDashboardApp;

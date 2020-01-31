/**
 * DashboardSearchFunnel component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import DashboardSearchFunnelInner from './dashboard-widget-search-funnel-inner';
/**
 * External dependencies
 */
import Layout from 'GoogleComponents/layout/layout';
import DashboardModuleHeader from 'GoogleComponents/dashboard/dashboard-module-header';
import AnalyticsInactiveCTA from 'GoogleComponents/analytics-inactive-cta';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class DashboardSearchFunnel extends Component {
	render() {
		const { canManageOptions } = global.googlesitekit.permissions;

		// Users without manage options capability will not see Setup CTA.
		const wrapperCols = ! global.googlesitekit.modules.analytics.active && ! canManageOptions ? 6 : 12;

		return (
			<Fragment>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					<DashboardModuleHeader
						title={ __( 'Search Funnel', 'google-site-kit' ) }
						description={ __( 'How your site appeared in Search results and how many visitors you got from Search.', 'google-site-kit' ) }
						timePeriod={ __( 'Last 28 days', 'google-site-kit' ) }
					/>
				</div>
				<div className={ `
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-${ wrapperCols }
				` } >
					<Layout className="googlesitekit-analytics-search-funnel">
						<div className="mdc-layout-grid">
							<div className="mdc-layout-grid__inner">
								<DashboardSearchFunnelInner />
								{ // Show the Analytics CTA if analytics is not enabled.
									( ! global.googlesitekit.modules.analytics.active ) &&
									<div className="
										mdc-layout-grid__cell
										mdc-layout-grid__cell--span-4-phone
										mdc-layout-grid__cell--span-4-tablet
										mdc-layout-grid__cell--span-6-desktop
									">
										<AnalyticsInactiveCTA />
									</div>
								}
							</div>
						</div>
					</Layout>
				</div>
			</Fragment>
		);
	}
}

export default DashboardSearchFunnel;

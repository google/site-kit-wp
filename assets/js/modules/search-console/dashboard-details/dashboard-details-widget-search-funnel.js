/**
 * DashboardDetailsSearchFunnel component.
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
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Layout from '../../../components/layout/layout';
import DashboardSearchFunnelInner from '../dashboard/dashboard-widget-search-funnel-inner';
import { getModulesData } from '../../../util';
import AnalyticsInactiveCTA from '../../../components/analytics-inactive-cta';
import DashboardModuleHeader from '../../../components/dashboard/dashboard-module-header';

class DashboardDetailsSearchFunnel extends Component {
	render() {
		return (
			<Fragment>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					<DashboardModuleHeader
						description={ __( 'How your site appeared in Search results and how many visitors you got from Search.', 'google-site-kit' ) }
						title={ __( 'Search Funnel', 'google-site-kit' ) }
					/>
				</div>
				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
					<Layout className="googlesitekit-analytics-search-funnel">
						<div className="mdc-layout-grid">
							<div className="mdc-layout-grid__inner">
								<DashboardSearchFunnelInner />
								{ // Show the Analytics CTA if analytics is not enabled.
									( ! getModulesData().analytics.active ) &&
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

export default DashboardDetailsSearchFunnel;

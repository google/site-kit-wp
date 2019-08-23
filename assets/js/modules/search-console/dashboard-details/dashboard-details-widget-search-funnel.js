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
 * Internal dependencies
 */
import DashboardSearchFunnelInner from '../dashboard/dashboard-widget-search-funnel-inner';
/**
 * External dependencies
 */
import Layout from 'GoogleComponents/layout/layout';
import AnalyticsInactiveCTA from 'GoogleComponents/analytics-inactive-cta';

const { Component } = wp.element;

class DashboardDetailsSearchFunnel extends Component {
	render() {
		return (
			<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
				<Layout className="googlesitekit-analytics-search-funnel">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<DashboardSearchFunnelInner />
							{ // Show the Analytics CTA if analytics is not enabled.
								( ! googlesitekit.modules.analytics.active ) &&
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
		);
	}
}

export default DashboardDetailsSearchFunnel;

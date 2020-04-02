/**
 * AnalyticsDashboardDetailsWidgetTopAcquisitionSources component.
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
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DashboardModuleHeader from '../../../components/dashboard/dashboard-module-header';
import Layout from '../../../components//layout/layout';
import AnalyticsDashboardWidgetTopAcquisitionSources from '../dashboard/dashboard-widget-top-acquisition-sources-table';
import DashboardAcquisitionPieChart from '../dashboard/dashboard-widget-acquisition-piechart';

class AnalyticsDashboardDetailsWidgetTopAcquisitionSources extends Component {
	render() {
		return (
			<Fragment>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					<DashboardModuleHeader
						title={ __( 'All Traffic', 'google-site-kit' ) }
						description={ __( 'How people found your page.', 'google-site-kit' ) }
					/>
				</div>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					<Layout
						className="googlesitekit-analytics-acquisition-sources"
						footer
						headerCtaLink="https://analytics.google.com"
						headerCtaLabel={ __( 'See full stats in Analytics', 'google-site-kit' ) }
						footerCtaLabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
						footerCtaLink="https://analytics.google.com"
					>
						<div className="mdc-layout-grid">
							<div className="mdc-layout-grid__inner">
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-4-desktop
									mdc-layout-grid__cell--span-8-tablet
									mdc-layout-grid__cell--span-4-phone
								">
									<DashboardAcquisitionPieChart />
								</div>
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-8-desktop
									mdc-layout-grid__cell--span-8-tablet
									mdc-layout-grid__cell--span-4-phone
								">
									<AnalyticsDashboardWidgetTopAcquisitionSources />
								</div>
							</div>
						</div>
					</Layout>
				</div>
			</Fragment>
		);
	}
}

export default AnalyticsDashboardDetailsWidgetTopAcquisitionSources;

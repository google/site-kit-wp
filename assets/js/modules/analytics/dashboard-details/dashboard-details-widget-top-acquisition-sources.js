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
 * Internal dependencies
 */
import AnalyticsDashboardWidgetTopAcquisitionSources from '../dashboard/dashboard-widget-top-acquisition-sources-table';
/**
 * External dependencies
 */
import Layout from 'GoogleComponents/layout/layout';
import DashboardAcquisitionPieChart from '../dashboard/dashboard-widget-acquisition-piechart';

const { Component, Fragment } = wp.element;
const { __ } = wp.i18n;

class AnalyticsDashboardDetailsWidgetTopAcquisitionSources extends Component {
	render() {
		return (
			<Fragment>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					<Layout
						className="googlesitekit-analytics-acquisition-sources"
						header
						footer
						title={ __( 'Acquisition Sources', 'google-site-kit' ) }
						headerCtaLink="https://analytics.google.com"
						headerCtaLabel={ __( 'See full stats in Analytics', 'google-site-kit' ) }
						footerCtaLabel={ __( 'Analytics', 'google-site-kit' ) }
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

/**
 * DashboardEarnings component.
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

import DashboardModuleHeader from 'GoogleComponents/dashboard/dashboard-module-header';
import DashboardAdSenseTopEarningPagesSmall from './dashboard-adsense-top-pages-small';
import AdSenseDashboardMainSummary from './dashboard-widget-main-summary';
import ModuleSettingsWarning from 'GoogleComponents/notifications/module-settings-warning';

const { Component, Fragment } = wp.element;
const { __ } = wp.i18n;

class DashboardEarnings extends Component {

	render() {
		return (
			<Fragment>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					<DashboardModuleHeader
						title={ __( 'Earnings', 'google-site-kit' ) }
						description={ __( 'How much you’re earning from your content through AdSense.', 'google-site-kit' ) }
						timePeriod={ __( 'Last 28 days', 'google-site-kit' ) }
					/>
					<ModuleSettingsWarning slug="adsense" context="module-sitekit-dashboard" />
				</div>
				<AdSenseDashboardMainSummary/>
				<DashboardAdSenseTopEarningPagesSmall/>
			</Fragment>
		);
	}
}

export default DashboardEarnings;

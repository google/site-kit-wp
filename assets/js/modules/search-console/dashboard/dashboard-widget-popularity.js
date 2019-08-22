/**
 * DashboardPopularity component.
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
import DashboardPopularityInner from './dashboard-widget-popularity-inner';
/**
 * External dependencies
 */
import DashboardModuleHeader from 'GoogleComponents/dashboard/dashboard-module-header';

import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class DashboardPopularity extends Component {
	render() {
		return (
			<Fragment>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					<DashboardModuleHeader
						title={ __( 'Popularity', 'google-site-kit' ) }
						description={ __( 'Your most popular pages and how people found them from Search.', 'google-site-kit' ) }
						timePeriod={ __( 'Last 28 days', 'google-site-kit' ) }
					/>
				</div>
				<DashboardPopularityInner />
			</Fragment>
		);
	}
}

export default DashboardPopularity;

/**
 * WPAnalyticsDashboardWidgetOverview component.
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
 * External dependencies
 */
import PreviewBlocks from 'GoogleComponents/preview-blocks';
import DataBlock from 'GoogleComponents/data-block';
import CTA from 'GoogleComponents/notifications/cta';
import withData from 'GoogleComponents/higherorder/withdata';
import { TYPE_MODULES } from 'GoogleComponents/data';
import {
	getTimeInSeconds,
	prepareSecondsForDisplay,
	readableLargeNumber,
} from 'GoogleUtil';

/**
 * Internal dependencies
 */
import { calculateOverviewData, getAnalyticsErrorMessageFromData, isDataZeroForReporting, overviewReportDataDefaults } from '../util';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

class WPAnalyticsDashboardWidgetOverview extends Component {
	render() {
		const { data } = this.props;

		if ( ! data || ! data.length ) {
			return null;
		}

		const overviewData = calculateOverviewData( data );

		if ( ! overviewData ) {
			return null;
		}

		const {
			totalUsers,
			averageSessionDuration,
			totalUsersChange,
			averageSessionDurationChange,
		} = overviewData;

		return (
			<Fragment>
				{ ! data.length
					? <div className="googlesitekit-wp-dashboard-stats__cta">
						<CTA
							title={ __( 'Analytics Gathering Data', 'google-site-kit' ) }
							description={ __( 'Analytics data is not yet available, please check back later.', 'google-site-kit' ) }
							ctaLink={ '' }
							ctaLabel={ '' }
						/>
					</div>
					: <Fragment>
						<DataBlock
							className="googlesitekit-wp-dashboard-stats__data-table overview-total-users"
							title={ __( 'Total Unique Visitors', 'google-site-kit' ) }
							datapoint={ readableLargeNumber( totalUsers ) }
							change={ totalUsersChange }
							changeDataUnit="%"
						/>
						<DataBlock
							className="googlesitekit-wp-dashboard-stats__data-table overview-average-session-duration"
							title={ __( 'Avg. Time on Page', 'google-site-kit' ) }
							datapoint={ prepareSecondsForDisplay( averageSessionDuration ) }
							change={ averageSessionDurationChange }
							changeDataUnit="%"
						/>
					</Fragment>
				}
			</Fragment>
		);
	}
}

export default withData(
	WPAnalyticsDashboardWidgetOverview,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: overviewReportDataDefaults,
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'WPDashboard' ],
		},
	],
	<PreviewBlocks
		width="23%"
		height="94px"
		count={ 2 }
	/>,
	{},
	isDataZeroForReporting,
	getAnalyticsErrorMessageFromData
);

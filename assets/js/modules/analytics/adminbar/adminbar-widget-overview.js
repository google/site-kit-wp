/**
 * AnalyticsAdminbarWidgetOverview component.
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
import DataBlock from 'GoogleComponents/data-block.js';
import withData from 'GoogleComponents/higherorder/withdata';
import {
	getTimeInSeconds,
	readableLargeNumber,
} from 'GoogleUtil';
/**
 * Internal dependencies
 */
import {
	calculateOverviewData,
	isDataZeroForReporting,
	getAnalyticsErrorMessageFromData,
} from '../util';
import PreviewBlock from 'GoogleComponents/preview-block';

const { __ } = wp.i18n;
const { Component, Fragment } = wp.element;

class AnalyticsAdminbarWidgetOverview extends Component {
	render() {
		const { data } = this.props;

		if ( ! data || data.error || ! data.length ) {
			return null;
		}

		const overviewData = calculateOverviewData( data );

		if ( ! overviewData ) {
			return null;
		}

		const {
			totalUsers,
			totalSessions,
			totalUsersChange,
			totalSessionsChange,
		} = overviewData;

		return (
			<Fragment>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-2-tablet
					mdc-layout-grid__cell--span-3-desktop
				">
					<DataBlock
						className="overview-total-users"
						title={ __( 'Total Users', 'google-site-kit' ) }
						datapoint={ readableLargeNumber( totalUsers ) }
						change={ totalUsersChange }
						changeDataUnit="%"
					/>
				</div>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-2-tablet
					mdc-layout-grid__cell--span-3-desktop
				">
					<DataBlock
						className="overview-total-sessions"
						title={ __( 'Total Sessions', 'google-site-kit' ) }
						datapoint={ readableLargeNumber( totalSessions ) }
						change={ totalSessionsChange }
						changeDataUnit="%"
					/>
				</div>
			</Fragment>
		);
	}
}

export default withData(
	AnalyticsAdminbarWidgetOverview,
	[
		{
			type: 'modules',
			identifier: 'analytics',
			datapoint: 'overview',
			data: {
				permaLink: googlesitekit.permaLink,
				postID: googlesitekit.postID,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Adminbar',
		},
	],
	<Fragment>
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--span-2-tablet
			mdc-layout-grid__cell--span-3-desktop
		">
			<PreviewBlock width="auto" height="59px" />
		</div>
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--span-2-tablet
			mdc-layout-grid__cell--span-3-desktop
		">
			<PreviewBlock width="auto" height="59px" />
		</div>
	</Fragment>,
	{ inGrid: true },
	isDataZeroForReporting,
	getAnalyticsErrorMessageFromData

);

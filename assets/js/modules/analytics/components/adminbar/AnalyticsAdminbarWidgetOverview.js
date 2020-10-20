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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	getTimeInSeconds,
	readableLargeNumber,
	changeToPercent,
} from '../../../../util';
import DataBlock from '../../../../components/data-block';
import withData from '../../../../components/higherorder/withdata';
import { TYPE_MODULES } from '../../../../components/data';
import {
	calculateOverviewData,
	isDataZeroForReporting,
	getAnalyticsErrorMessageFromData,
	overviewReportDataDefaults,
	userReportDataDefaults,
	parseTotalUsersData,
} from '../../util';
import PreviewBlock from '../../../../components/PreviewBlock';

class AnalyticsAdminbarWidgetOverview extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			overview: false,
			totalUsers: false,
			previousTotalUsers: false,
		};
	}

	// When additional data is returned, componentDidUpdate will fire.
	componentDidUpdate() {
		this.processCallbackData();
	}

	componentDidMount() {
		this.processCallbackData();
	}

	/**
	 * Process callback data received from the API.
	 */
	processCallbackData() {
		const {
			data,
			requestDataToState,
		} = this.props;

		if ( data && ! data.error && 'function' === typeof requestDataToState ) {
			this.setState( requestDataToState );
		}
	}

	render() {
		const { overview, totalUsers, previousTotalUsers } = this.state;

		if ( ! overview || ! totalUsers ) {
			return null;
		}

		const {
			totalSessions,
			totalSessionsChange,
		} = overview;

		const totalUsersChange = changeToPercent( previousTotalUsers, totalUsers );

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
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: {
				...overviewReportDataDefaults,
				url: global._googlesitekitLegacyData.permaLink,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Adminbar',
			toState( state, { data } ) {
				if ( ! state.overview ) {
					return {
						overview: calculateOverviewData( data ),
					};
				}
			},
		},
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: {
				...userReportDataDefaults,
				url: global._googlesitekitLegacyData.permaLink,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Adminbar',
			toState( state, { data } ) {
				if ( false === state.totalUsers ) {
					return parseTotalUsersData( data );
				}
			},
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

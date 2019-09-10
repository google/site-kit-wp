/**
 * AnalyticsDashboardWidgetTopLevel component.
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
import { TYPE_MODULES } from 'GoogleComponents/data';

/**
 * Internal dependencies
 */
import Sparkline from 'GoogleComponents/sparkline';
import CTA from 'GoogleComponents/notifications/cta';
import PreviewBlock from 'GoogleComponents/preview-block';
import {
	getTimeInSeconds,
	readableLargeNumber,
	extractForSparkline,
	getSiteKitAdminURL,
} from 'GoogleUtil';
import {
	calculateOverviewData,
	extractAnalyticsDashboardSparklineData,
	getAnalyticsErrorMessageFromData,
	siteAnalyticsReportDataDefaults,
	overviewReportDataDefaults,
	isDataZeroForReporting,
} from '../util';

const { __ } = wp.i18n;
const { Component, Fragment } = wp.element;
const { isEmpty } = lodash;

class AnalyticsDashboardWidgetTopLevel extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			accounts: false,
			goals: false,
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
		const {
			overview,
			extractedAnalytics,
			goals,
		} = this.state;

		const { permaLink } = googlesitekit;

		const href = getSiteKitAdminURL( 'googlesitekit-module-analytics', {} );
		const goalURL = 'https://support.google.com/analytics/answer/1032415?hl=en#create_or_edit_goals';

		let totalUsers = '',
			totalUsersChange = '',
			goalCompletions = '',
			goalCompletionsChange = '',
			averageBounceRate = '',
			averageBounceRateChange = '';

		if ( overview ) {
			totalUsers = overview.totalUsers;
			totalUsersChange = overview.totalUsersChange;
			goalCompletions = overview.goalCompletions;
			goalCompletionsChange = overview.goalCompletionsChange;
			averageBounceRate = overview.averageBounceRate;
			averageBounceRateChange = overview.averageBounceRateChange;
		}

		return (
			<Fragment>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--align-bottom
					mdc-layout-grid__cell--span-2-phone
					mdc-layout-grid__cell--span-2-tablet
					mdc-layout-grid__cell--span-3-desktop
				">
					<DataBlock
						className="overview-total-users"
						title={ __( 'Unique Visitors from Search', 'google-site-kit' ) }
						datapoint={ readableLargeNumber( totalUsers ) }
						change={ totalUsersChange }
						changeDataUnit="%"
						source={ {
							name: __( 'Analytics', 'google-site-kit' ),
							link: href,
						} }
						sparkline={
							extractedAnalytics &&
								<Sparkline
									data={ extractForSparkline( extractedAnalytics, 1 ) }
									change={ totalUsersChange }
									id="analytics-users-sparkline"
								/>
						}
					/>
				</div>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--align-bottom
					mdc-layout-grid__cell--span-2-phone
					mdc-layout-grid__cell--span-2-tablet
					mdc-layout-grid__cell--span-3-desktop
				">
					{
						/**
						 * The forth block shows goals for general view, and average time on page for detail view.
						 */
					}
					{
						permaLink && (
							<DataBlock
								className="overview-bounce-rate"
								title={ __( 'Bounce Rate', 'google-site-kit' ) }
								datapoint={ Number( averageBounceRate ).toFixed( 2 ) }
								datapointUnit={ __( '%', 'google-site-kit' ) }
								change={ averageBounceRateChange }
								changeDataUnit="%"
								reverseArrowDirection
								source={ {
									name: __( 'Analytics', 'google-site-kit' ),
									link: href,
								} }
								sparkline={
									extractedAnalytics &&
										<Sparkline
											data={ extractForSparkline( extractedAnalytics, 2 ) }
											change={ averageBounceRateChange }
											id="analytics-sessions-sparkline"
										/>
								}
							/>
						) }
					{ ! permaLink && goals && isEmpty( goals.items ) && (
						<CTA
							title={ __( 'Use goals to measure success. ', 'google-site-kit' ) }
							description={ __( 'Goals measure how well your site or app fulfills your target objectives.', 'google-site-kit' ) }
							ctaLink={ goalURL }
							ctaLabel={ __( 'Create a new goal', 'google-site-kit' ) }
						/>
					)
					}
					{ ! permaLink && goals && ! isEmpty( goals.items ) && (
						<DataBlock
							className="overview-goals-completed"
							title={ __( 'Goals Completed', 'google-site-kit' ) }
							datapoint={ readableLargeNumber( goalCompletions ) }
							change={ goalCompletionsChange }
							changeDataUnit="%"
							source={ {
								name: __( 'Analytics', 'google-site-kit' ),
								link: href,
							} }
							sparkline={
								extractedAnalytics &&
								<Sparkline
									data={ extractForSparkline( extractedAnalytics, 3 ) }
									change={ goalCompletionsChange }
									id="analytics-sessions-sparkline"
								/>
							}
						/>
					) }
					{ ! permaLink && ! goals && (
						<PreviewBlock width="100%" height="202px" />
					) }
				</div>
			</Fragment>
		);
	}
}

const isDataZero = ( data, datapoint ) => {
	if ( 'report' === datapoint ) {
		return isDataZeroForReporting( data );
	}

	return false;
};

/*
Note: toState callbacks below accept the current data and state into an object which is passed to setState.
This is because withData changes the props passed to the child for each request.
*/

export default withData(
	AnalyticsDashboardWidgetTopLevel,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: {
				...overviewReportDataDefaults,
				url: googlesitekit.permaLink,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard',
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
				...siteAnalyticsReportDataDefaults,
				url: googlesitekit.permaLink,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard',
			toState( state, { data } ) {
				if ( ! state.extractedAnalytics ) {
					return {
						extractedAnalytics: extractAnalyticsDashboardSparklineData( data ),
					};
				}
			},
		},
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'goals',
			data: {
				url: googlesitekit.permaLink,
			},
			priority: 10,
			maxAge: getTimeInSeconds( 'hour' ),
			context: 'Dashboard',
			toState( state, { data } ) {
				if ( ! state.goals ) {
					return {
						goals: data,
					};
				}
			},
		},
	],
	<Fragment>
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--align-bottom
			mdc-layout-grid__cell--span-2-phone
			mdc-layout-grid__cell--span-2-tablet
			mdc-layout-grid__cell--span-3-desktop
		">
			<PreviewBlock width="100%" height="202px" />
		</div>
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--align-bottom
			mdc-layout-grid__cell--span-2-phone
			mdc-layout-grid__cell--span-2-tablet
			mdc-layout-grid__cell--span-3-desktop
		">
			<PreviewBlock width="100%" height="202px" />
		</div>
	</Fragment>,
	{
		inGrid: true,
	},
	isDataZero,
	getAnalyticsErrorMessageFromData
);

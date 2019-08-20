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
/**
 * Internal dependencies
 */
import { extractAnalyticsDashboardSparklineData } from '../util';
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
	getAnalyticsErrorMessageFromData,
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

		this.processCallbackData = this.processCallbackData.bind( this );
		this.setOverviewData = this.setOverviewData.bind( this );
		this.setGoalsData = this.setGoalsData.bind( this );
		this.setAnalyticsData = this.setAnalyticsData.bind( this );
	}

	// When additional data is returned, componentDidUpdate will fire.
	componentDidUpdate( prevProps ) {
		const {
			data,
			datapoint,
		} = this.props;

		this.processCallbackData( data, datapoint, prevProps );
	}

	componentDidMount() {
		const {
			data,
			datapoint,
		} = this.props;

		this.processCallbackData( data, datapoint, {} );
	}

	/**
	 * Process callback data received from the API.
	 *
	 * @param {Object} data Response data from the API.
	 * @param {string} datapoint data point for the callback conditional.
	 * @param {Object} prevProps previous props when component did update.
	 * @return {null}
	 */
	processCallbackData( data, datapoint, prevProps = {} ) {
		if ( ! data ) {
			return null;
		}

		switch ( datapoint ) {
			case 'site-analytics':
				this.setAnalyticsData( data, prevProps );
				break;
			case 'goals':
				this.setGoalsData( data, prevProps );
				break;
			case 'overview':
				this.setOverviewData( data, prevProps );
				break;
		}
	}

	setAnalyticsData( data, prevProps = {} ) {
		if ( this.state.extractedAnalytics || 'site-analytics' === prevProps.datapoint ) {
			return null;
		}

		if ( data && data.error ) {
			return null;
		}

		this.setState( {
			extractedAnalytics: extractAnalyticsDashboardSparklineData( data ),
		} );
	}

	setOverviewData( data, prevProps = {} ) {
		if ( this.state.overview || 'overview' === prevProps.datapoint ) {
			return null;
		}

		if ( data && data.error ) {
			return null;
		}

		this.setState( {
			overview: calculateOverviewData( data ),
		} );
	}

	setGoalsData( data, prevProps = {} ) {
		if ( this.state.goals || 'goals' === prevProps.datapoint ) {
			return null;
		}

		if ( data && data.error ) {
			return null;
		}

		// do nothing.
		if ( 'goals' === prevProps.datapoint ) {
			return null;
		}

		this.setState( {
			goals: data,
		} );
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
			averageSessionDuration = '',
			averageSessionDurationChange = '';

		if ( overview ) {
			totalUsers = overview.totalUsers;
			totalUsersChange = overview.totalUsersChange;
			goalCompletions = overview.goalCompletions;
			goalCompletionsChange = overview.goalCompletionsChange;
			averageSessionDuration = overview.averageSessionDuration;
			averageSessionDurationChange = overview.averageSessionDurationChange;
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
						permaLink ?
							<DataBlock
								className="overview-average-time-on-page"
								title={ __( 'Average Session Duration', 'google-site-kit' ) }
								datapoint={ Math.round( averageSessionDuration ) }
								datapointUnit={ __( 's', 'google-site-kit' ) }
								change={ averageSessionDurationChange }
								changeDataUnit="%"
								source={ {
									name: __( 'Analytics', 'google-site-kit' ),
									link: href,
								} }
								sparkline={
									extractedAnalytics &&
										<Sparkline
											data={ extractForSparkline( extractedAnalytics, 3 ) }
											change={ averageSessionDurationChange }
											id="analytics-sessions-sparkline"
										/>
								}
							/> :
							goals ?
								isEmpty( goals.items ) ?
									<CTA
										title={ __( 'Use goals to measure success. ', 'google-site-kit' ) }
										description={ __( 'Goals measure how well your site or app fulfills your target objectives.', 'google-site-kit' ) }
										ctaLink={ goalURL }
										ctaLabel={ __( 'Create a new goal', 'google-site-kit' ) }
									/> :
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
									/> :
								<PreviewBlock width="100%" height="202px" />
					}
				</div>
			</Fragment>
		);
	}
}

const isDataZero = ( data, datapoint ) => {
	if ( 'overview' !== datapoint ) {
		return false;
	}

	// Handle empty data.
	if ( ! data || ! data.length ) {
		return true;
	}

	const overview = calculateOverviewData( data );

	let totalUsers = '',
		totalSessions = '',
		totalPageViews = '';

	if ( overview ) {
		totalUsers = overview.totalUsers;
		totalSessions = overview.totalSessions;
		totalPageViews = overview.totalPageViews;
	}

	const analyticsDataIsEmpty =
		0 === parseInt( totalUsers ) &&
		0 === parseInt( totalSessions ) &&
		0 === parseInt( totalPageViews );

	return analyticsDataIsEmpty;
};

export default withData(
	AnalyticsDashboardWidgetTopLevel,
	[
		{
			dataObject: 'modules',
			identifier: 'analytics',
			permaLink: googlesitekit.permaLink,
			datapoint: 'overview',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard',
		},
		{
			dataObject: 'modules',
			identifier: 'analytics',
			permaLink: googlesitekit.permaLink,
			datapoint: 'site-analytics',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard',
		},
		{
			dataObject: 'modules',
			identifier: 'analytics',
			permaLink: googlesitekit.permaLink,
			datapoint: 'goals',
			priority: 1,
			maxAge: getTimeInSeconds( 'hour' ),
			context: 'Dashboard',
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

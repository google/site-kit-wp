/**
 * AnalyticsDashboardWidgetTopLevel component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Fragment, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	getTimeInSeconds,
	calculateChange,
	getURLPath,
} from '../../../../util';
import extractForSparkline from '../../../../util/extract-for-sparkline';
import {
	calculateOverviewData,
	extractAnalyticsDashboardSparklineData,
	getAnalyticsErrorMessageFromData,
	siteAnalyticsReportDataDefaults,
	overviewReportDataDefaults,
	isDataZeroForReporting,
	userReportDataDefaults,
	parseTotalUsersData,
} from '../../util';
import Data from 'googlesitekit-data';
import DataBlock from '../../../../components/DataBlock';
import withData from '../../../../components/higherorder/withData';
import { TYPE_MODULES } from '../../../../components/data';
import Sparkline from '../../../../components/Sparkline';
import CTA from '../../../../components/legacy-notifications/cta';
import PreviewBlock from '../../../../components/PreviewBlock';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME } from '../../datastore/constants';

const { useSelect } = Data;

function LegacyAnalyticsDashboardWidgetTopLevel( { data, requestDataToState } ) {
	const [ goals, setGoals ] = useState( false );
	const [ totalUsers, setTotalUsers ] = useState( false );
	const [ previousTotalUsers, setPreviousTotalUsers ] = useState( false );
	const [ overview, setOverview ] = useState( false );
	const [ extractedAnalytics, setExtractedAnalytics ] = useState( false );

	useEffect( () => {
		if ( data && ! data.error && 'function' === typeof requestDataToState ) {
			const {
				goals: goalsData,
				overview: overviewData,
				extractedAnalytics: extractedAnalyticsData,
				totalUsers: totalUsersData,
				previousTotalUsers: previousTotalUsersData,
			} = requestDataToState( { goals, overview, extractedAnalytics, totalUsers, previousTotalUsers }, { data } ) || {};

			if ( undefined !== goalsData ) {
				setGoals( goalsData );
			}

			if ( undefined !== overviewData ) {
				setOverview( overviewData );
			}

			if ( undefined !== extractedAnalyticsData ) {
				setExtractedAnalytics( extractedAnalyticsData );
			}

			if ( undefined !== totalUsersData ) {
				setTotalUsers( totalUsersData );
			}

			if ( undefined !== previousTotalUsersData ) {
				setPreviousTotalUsers( previousTotalUsersData );
			}
		}
	}, [ data, requestDataToState, goals, overview, extractedAnalytics, totalUsers, previousTotalUsers, setGoals, setOverview, setExtractedAnalytics, setTotalUsers, setPreviousTotalUsers ] );

	const { permaLink } = global._googlesitekitLegacyData;

	const url = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );

	const uniqueVisitorsServiceURL = useSelect( ( select ) => select( STORE_NAME ).getServiceReportURL( `visitors-overview`, {
		'_r.drilldown': url ? `analytics.pagePath:${ getURLPath( url ) }` : undefined,
	} ) );
	const goalsServiceURL = useSelect( ( select ) => select( STORE_NAME ).getServiceReportURL( `conversions-goals-overview`, {
		'_r.drilldown': url ? `analytics.pagePath:${ getURLPath( url ) }` : undefined,
	} ) );
	const goalURL = useSelect( ( select ) => select( CORE_SITE ).getGoogleSupportURL( {
		path: '/analytics/answer/1032415',
		hash: 'create_or_edit_goals',
	} ) );

	let goalCompletions = '',
		goalCompletionsChange = '',
		averageBounceRate = '',
		averageBounceRateChange = '';

	if ( overview ) {
		goalCompletions = overview.goalCompletions;
		goalCompletionsChange = overview.goalCompletionsChange;
		averageBounceRate = overview.averageBounceRate / 100;
		averageBounceRateChange = overview.averageBounceRateChange;
	}

	const totalUsersChange = calculateChange( previousTotalUsers, totalUsers );

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
					datapoint={ totalUsers || 0 }
					change={ totalUsersChange }
					changeDataUnit="%"
					source={ {
						name: _x( 'Analytics', 'Service name', 'google-site-kit' ),
						link: uniqueVisitorsServiceURL,
						external: true,
					} }
					sparkline={
						extractedAnalytics &&
						<Sparkline
							data={ extractForSparkline( extractedAnalytics, 1 ) }
							change={ totalUsersChange }
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
							datapoint={ averageBounceRate }
							datapointUnit="%"
							change={ averageBounceRateChange }
							changeDataUnit="%"
							invertChangeColor
							source={ {
								name: _x( 'Analytics', 'Service name', 'google-site-kit' ),
								link: uniqueVisitorsServiceURL,
								external: true,
							} }
							sparkline={
								extractedAnalytics &&
									<Sparkline
										data={ extractForSparkline( extractedAnalytics, 2 ) }
										change={ averageBounceRateChange }
									/>
							}
						/>
					) }
				{ ! permaLink && goals && isEmpty( goals.items ) && (
					<CTA
						title={ __( 'Use goals to measure success', 'google-site-kit' ) }
						description={ __( 'Goals measure how well your site or app fulfills your target objectives', 'google-site-kit' ) }
						ctaLink={ goalURL }
						ctaLabel={ __( 'Create a new goal', 'google-site-kit' ) }
					/>
				)
				}
				{ ! permaLink && goals && ! isEmpty( goals.items ) && (
					<DataBlock
						className="overview-goals-completed"
						title={ __( 'Goals Completed', 'google-site-kit' ) }
						datapoint={ goalCompletions }
						change={ goalCompletionsChange }
						changeDataUnit="%"
						source={ {
							name: _x( 'Analytics', 'Service name', 'google-site-kit' ),
							link: goalsServiceURL,
							external: true,
						} }
						sparkline={
							extractedAnalytics &&
								<Sparkline
									data={ extractForSparkline( extractedAnalytics, 3 ) }
									change={ goalCompletionsChange }
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
	//}
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
	LegacyAnalyticsDashboardWidgetTopLevel,
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
				...userReportDataDefaults,
				url: global._googlesitekitLegacyData.permaLink,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard',
			toState( state, { data } ) {
				if ( false === state.totalUsers ) {
					return parseTotalUsersData( data );
				}
			},
		},
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: {
				...siteAnalyticsReportDataDefaults,
				url: global._googlesitekitLegacyData.permaLink,
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
				url: global._googlesitekitLegacyData.permaLink,
			},
			priority: 1,
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

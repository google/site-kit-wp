/**
 * Traffic Overview test helpers.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	FreshDataDateRange,
	getFreshDataDateRange,
} from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import {
	getInsightReportArgs,
	getTopChannelsReportOptions,
	getTopPostsReportOptions,
	getTopReferralsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { getRecentTrafficBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getRecentTrafficBreakdownRows';
import {
	getComparisonDateRange,
	getDateDimensionValues,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/insight';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import { getPageTitlesReportOptions } from '@/js/modules/analytics-4/utils/page-titles-report';

export interface RecentTrafficBreakdownReportOptions {
	/** The options of the "Top posts by visitors" report. */
	posts: ReportOptions;
	/** The options of the "Top channels by visitors" report. */
	channels: ReportOptions;
	/** The options of the "Top referrals by visitors" report. */
	referrals: ReportOptions;
}

export interface RecentTrafficBreakdownReports {
	/** The report of visitors for each page path. */
	posts?: Report;
	/** The title of each page path, for the pages the posts column shows. */
	postTitles?: Record< string, string >;
	/** The report of visitors for each channel. */
	channels?: Report;
	/** The report of visitors for each site that referred them. */
	referrals?: Report;
}

/**
 * Builds a breakdown report from label and visitor pairs, in the order given.
 *
 * The visitors are strings, the way the API returns them. With
 * `totalVisitors`, the report also has the totals row the API returns.
 *
 * @since 1.188.0
 * @since 1.189.0 Moved to a shared test helper.
 * @since n.e.x.t Added the `totalVisitors` parameter.
 *
 * @param {Array<Array>} pairs           `[ label, visitors ]` pairs.
 * @param {number}       [totalVisitors] Optional. The visitors in the report's total.
 * @return {Object} The breakdown report.
 */
export function createBreakdownReport(
	pairs: Array< [ string, number ] >,
	totalVisitors?: number
): Report {
	const report: Report = {
		rows: pairs.map( ( [ label, visitors ] ) => ( {
			dimensionValues: [ { value: label } ],
			metricValues: [ { value: String( visitors ) } ],
		} ) ),
	};

	if ( totalVisitors !== undefined ) {
		report.totals = [
			{
				dimensionValues: [ { value: 'RESERVED_TOTAL' } ],
				metricValues: [ { value: String( totalVisitors ) } ],
			},
		];
	}

	return report;
}

/**
 * Builds the insight notice's report for a Recent activity date range.
 *
 * The report has a row for every day, the way the API returns it. Each
 * window's visitors fall on the window's last day, and every other day has no
 * visitors.
 *
 * @since n.e.x.t
 *
 * @param {Object}        dateRange   The Recent activity date range.
 * @param {number}        current     Visitors in the date range.
 * @param {Array<number>} comparisons Visitors in the same date range one, two, three and four weeks earlier. A missing week has no visitors.
 * @return {Object} The insight report.
 */
export function createInsightReport(
	dateRange: FreshDataDateRange,
	current: number,
	comparisons: number[]
): Report {
	const { startDate, endDate } = getInsightReportArgs( dateRange );
	const visitorsByDate = new Map< string, number >();

	[ current, ...comparisons ].forEach( ( visitors, weeks ) => {
		const comparison = getComparisonDateRange( dateRange, weeks );

		visitorsByDate.set( comparison.endDate.replace( /-/g, '' ), visitors );
	} );

	return {
		rows: getDateDimensionValues( startDate, endDate ).map( ( date ) => ( {
			dimensionValues: [ { value: date } ],
			metricValues: [
				{ value: String( visitorsByDate.get( date ) || 0 ) },
			],
		} ) ),
	};
}

/**
 * Puts the insight notice's report for the reference date's Recent activity
 * date range in the store.
 *
 * @since n.e.x.t
 *
 * @param {Object}        registry    The registry to put the report in.
 * @param {number}        current     Visitors in the date range.
 * @param {Array<number>} comparisons Visitors in the same date range one, two, three and four weeks earlier.
 * @return {void}
 */
export function provideInsightReport(
	registry: WPDataRegistry,
	current: number,
	comparisons: number[]
) {
	const dateRange = getFreshDataDateRange(
		registry.select( CORE_USER ).getReferenceDate()
	);

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport(
			createInsightReport( dateRange, current, comparisons ),
			{ options: getInsightReportArgs( dateRange ) }
		);
}

/**
 * Gets the class names of the direct children of a tab panel of
 * `TrafficOverviewWidget`, in order.
 *
 * @since n.e.x.t
 *
 * @param {Element} container The element the tab panel rendered into.
 * @return {Array<string>} The class names.
 */
export function getSectionClassNames( container: Element ): string[] {
	return Array.from(
		container.querySelectorAll(
			'.googlesitekit-traffic-overview__panel > *'
		)
	).map( ( section ) => section.className );
}

/**
 * Gets the options of the three reports of the Recent activity tab's traffic
 * breakdown, for the registry's reference date.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry, with its reference date set.
 * @return {Object} The options of the posts, channels, and referrals reports.
 */
export function getRecentTrafficBreakdownReportOptions(
	registry: WPDataRegistry
): RecentTrafficBreakdownReportOptions {
	const dateRange = getFreshDataDateRange(
		registry.select( CORE_USER ).getReferenceDate()
	);

	return {
		posts: getTopPostsReportOptions( dateRange ),
		channels: getTopChannelsReportOptions( dateRange ),
		referrals: getTopReferralsReportOptions( dateRange ),
	};
}

/**
 * Puts the given reports of the Recent activity tab's traffic breakdown in the
 * store, so the breakdown renders without sending a request. With the posts
 * report, it also puts in the report of titles the posts column requests.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry             The registry, with its reference date set.
 * @param {Object} reports              The reports.
 * @param {Object} [reports.posts]      Optional. The report of visitors for each page path.
 * @param {Object} [reports.postTitles] Optional. The title of each page path. A path with no title here has none in the report of titles.
 * @param {Object} [reports.channels]   Optional. The report of visitors for each channel.
 * @param {Object} [reports.referrals]  Optional. The report of visitors for each site that referred them.
 * @return {void}
 */
export function provideRecentTrafficBreakdownReports(
	registry: WPDataRegistry,
	{
		posts,
		postTitles = {},
		channels,
		referrals,
	}: RecentTrafficBreakdownReports
) {
	const reportOptions = getRecentTrafficBreakdownReportOptions( registry );
	const { receiveGetReport } = registry.dispatch( MODULES_ANALYTICS_4 );

	if ( posts ) {
		// A report from the API names its dimensions in `dimensionHeaders`,
		// and `getPageTitles` finds the page paths by that name.
		receiveGetReport(
			{ dimensionHeaders: [ { name: 'pagePath' } ], ...posts },
			{ options: reportOptions.posts }
		);

		const pagePaths = getRecentTrafficBreakdownRows( posts ).map(
			( { label } ) => label
		);

		if ( pagePaths.length ) {
			receiveGetReport(
				{
					rows: pagePaths
						.filter( ( pagePath ) => postTitles[ pagePath ] )
						.map( ( pagePath ) => ( {
							dimensionValues: [
								{ value: pagePath },
								{ value: postTitles[ pagePath ] },
							],
						} ) ),
				},
				{
					options: getPageTitlesReportOptions(
						reportOptions.posts,
						pagePaths
					),
				}
			);
		}
	}

	if ( channels ) {
		receiveGetReport( channels, { options: reportOptions.channels } );
	}

	if ( referrals ) {
		receiveGetReport( referrals, { options: reportOptions.referrals } );
	}
}

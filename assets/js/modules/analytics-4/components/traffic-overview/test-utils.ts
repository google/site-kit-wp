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
	LATEST_POST_RECENT_CONTENT_OPTIONS,
	TYPICAL_TRAFFIC_CHART_DAYS,
} from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	FreshDataDateRange,
	getFreshDataDateRange,
} from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import {
	PostReportArgs,
	getEngagementReportOptions,
	getPostReportArgs,
	getPurchasesReportOptions,
	getTopChannelReportOptions,
	getTopKeywordReportOptions,
	getTopReferrerReportOptions,
	getVisitorsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/postReportOptions';
import { getInsightReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import {
	getComparisonDateRange,
	getDateDimensionValues,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/insight';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import { provideRecentContent } from '@/js/modules/analytics-4/datastore/test-utils';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { getDateString, stringToDate } from '@/js/util';

export const LATEST_POST: RecentContentItem = {
	id: 12,
	title: 'Ice cream is good for your health',
	permalink: 'https://example.com/ice-cream/',
	pagePath: '/ice-cream/',
	publishedAt: '2026-09-17T12:30:00Z',
	sitePublishedAt: '2026-09-17T08:30:00',
};

/**
 * Gets the report arguments of `LATEST_POST` for the registry's reference date.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry with the reference date.
 * @return {Object} The post's permalink and the post's date range.
 */
export function getLatestPostReportArgs(
	registry: WPDataRegistry
): PostReportArgs {
	return getPostReportArgs(
		LATEST_POST,
		registry.select( CORE_USER ).getReferenceDate()
	);
}

/**
 * Stores `LATEST_POST` as the most recent post, so the latest post
 * performance section renders without a request.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to put the post in.
 * @return {void}
 */
export function provideLatestPost( registry: WPDataRegistry ) {
	provideRecentContent(
		registry,
		[ LATEST_POST ],
		LATEST_POST_RECENT_CONTENT_OPTIONS
	);
}

/**
 * Stores a report and marks its request as finished.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry  The registry to put the report in.
 * @param {string} storeName The store with the `getReport` selector.
 * @param {Object} options   The report options.
 * @param {*}      report    The report.
 * @return {void}
 */
function provideReport(
	registry: WPDataRegistry,
	storeName: string,
	options: object,
	report: unknown
) {
	registry.dispatch( storeName ).receiveGetReport( report, { options } );
	registry.dispatch( storeName ).finishResolution( 'getReport', [ options ] );
}

/**
 * Gets the options of the Analytics reports of the latest post performance
 * section for `LATEST_POST`, including its purchases report.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry with the reference date.
 * @return {Object} The report options, keyed by the report.
 */
export function getLatestPostAnalyticsReportOptions(
	registry: WPDataRegistry
): Record<
	'visitors' | 'topChannel' | 'topReferrer' | 'engagement' | 'purchases',
	ReportOptions
> {
	const reportArgs = getLatestPostReportArgs( registry );

	return {
		visitors: getVisitorsReportOptions( reportArgs ),
		topChannel: getTopChannelReportOptions( reportArgs ),
		topReferrer: getTopReferrerReportOptions( reportArgs ),
		engagement: getEngagementReportOptions( reportArgs ),
		purchases: getPurchasesReportOptions( reportArgs ),
	};
}

/**
 * Stores the Analytics reports of the latest post performance section for
 * `LATEST_POST`, including its purchases report.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to put the reports in.
 * @return {void}
 */
export function provideLatestPostAnalyticsReports( registry: WPDataRegistry ) {
	const { visitors, topChannel, topReferrer, engagement, purchases } =
		getLatestPostAnalyticsReportOptions( registry );

	const reports: Array< [ ReportOptions, Report ] > = [
		[
			visitors,
			{
				rows: [
					{
						dimensionValues: [ { value: 'new' } ],
						metricValues: [ { value: '66' } ],
					},
					{
						dimensionValues: [ { value: 'returning' } ],
						metricValues: [ { value: '28' } ],
					},
				],
				totals: [ { metricValues: [ { value: '94' } ] } ],
			},
		],
		[ topChannel, createBreakdownReport( [ [ 'Organic Social', 41 ] ] ) ],
		[ topReferrer, createBreakdownReport( [ [ 'substack.com', 23 ] ] ) ],
		[
			engagement,
			{
				rows: [
					{ metricValues: [ { value: '76' }, { value: '18' } ] },
				],
			},
		],
		[ purchases, createBreakdownReport( [ [ 'purchase', 4 ] ] ) ],
	];

	reports.forEach( ( [ options, report ] ) =>
		provideReport( registry, MODULES_ANALYTICS_4, options, report )
	);
}

/**
 * Gets the options of the Search Console report of the latest post
 * performance section for `LATEST_POST`.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry with the reference date.
 * @return {Object} The Search Console report options.
 */
export function getLatestPostKeywordReportOptions( registry: WPDataRegistry ) {
	return getTopKeywordReportOptions( getLatestPostReportArgs( registry ) );
}

/**
 * Stores the Search Console report of the latest post performance section for
 * `LATEST_POST`.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to put the report in.
 * @return {void}
 */
export function provideLatestPostKeywordReport( registry: WPDataRegistry ) {
	provideReport(
		registry,
		MODULES_SEARCH_CONSOLE,
		getLatestPostKeywordReportOptions( registry ),
		[ { keys: [ 'healthy ice cream' ], clicks: 12 } ]
	);
}

/**
 * Builds a breakdown report from label and visitor pairs, in the order given.
 *
 * The visitors are strings, the way the API returns them.
 *
 * @since 1.188.0
 * @since 1.189.0 Moved to a shared test helper.
 *
 * @param {Array<Array>} pairs `[ label, visitors ]` pairs.
 * @return {Object} The breakdown report.
 */
export function createBreakdownReport(
	pairs: Array< [ string, number ] >
): Report {
	return {
		rows: pairs.map( ( [ label, visitors ] ) => ( {
			dimensionValues: [ { value: label } ],
			metricValues: [ { value: String( visitors ) } ],
		} ) ),
	};
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
 * @since 1.190.0
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
 * Builds the daily rows of a benchmarking response, one for each day the
 * Typical Traffic chart plots. The last row is the given day.
 *
 * The checked-in `benchmarking-data.json` fixture has only four days.
 *
 * @since n.e.x.t
 *
 * @param {string}   endDate     The last day, as `YYYY-MM-DD`.
 * @param {Function} getVisitors Returns a day's visitors, given the day's position in the rows, from `0`, and the day as `YYYY-MM-DD`.
 * @return {Array.<Object>} The `{ date, visitors }` rows, oldest first.
 */
export function createDailyTrafficRows(
	endDate: string,
	getVisitors: ( dayIndex: number, date: string ) => number
): BenchmarkingDailyTrafficRow[] {
	// The date walks a day at a time, so a daylight-saving change inside the
	// rows doesn't skip or repeat a day.
	const day = stringToDate( endDate );
	day.setDate( day.getDate() - TYPICAL_TRAFFIC_CHART_DAYS + 1 );

	return Array.from(
		{ length: TYPICAL_TRAFFIC_CHART_DAYS },
		( _value, dayIndex ) => {
			const date = getDateString( day );

			day.setDate( day.getDate() + 1 );

			return { date, visitors: getVisitors( dayIndex, date ) };
		}
	);
}

/**
 * Gets an Analytics property's creation time at midday on the given day, as
 * `getPropertyCreateTime()` returns it.
 *
 * Midnight can fall on the day before or the day after in another time zone,
 * so a test or a story that creates the property at midday keeps its day.
 *
 * @since n.e.x.t
 *
 * @param {string} date The day the property was created, as `YYYY-MM-DD`.
 * @return {number} The creation time in milliseconds.
 */
export function getPropertyCreateTimeAtMidday( date: string ): number {
	const day = stringToDate( date );
	day.setHours( 12 );

	return day.getTime();
}

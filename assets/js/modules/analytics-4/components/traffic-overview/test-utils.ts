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
 * External dependencies
 */
import { isEqual, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getPlaceholderDailyTraffic } from '@/js/modules/analytics-4/components/traffic-overview/charts/placeholderTrafficChartData';
import { PLACEHOLDER_TOTAL_VISITS } from '@/js/modules/analytics-4/components/traffic-overview/components/placeholderTotalVisits';
import { LATEST_POST_RECENT_CONTENT_OPTIONS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
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
import {
	getInsightReportArgs,
	getSearchPerformanceReportOptions,
	getSiteVisitorsReportOptions,
	getTimeZoneReportOptions,
	getTopChannelsReportOptions,
	getTopPostsReportOptions,
	getTopReferralsReportOptions,
	getTotalVisitorsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { SearchPerformanceTotals } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/aggregateSearchConsoleRows';
import { getFreshDataWindowStart } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getFreshDataWindow';
import { getRecentTrafficBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getRecentTrafficBreakdownRows';
import {
	getComparisonDateRange,
	getDateDimensionValues,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/insight';
import { TrafficBreakdownValue } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { provideBenchmarkingData } from '@/js/modules/analytics-4/datastore/__factories__/benchmarking';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import { provideRecentContent } from '@/js/modules/analytics-4/datastore/test-utils';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import {
	BenchmarkingDailyTrafficRow,
	BenchmarkingKeyFactor,
	DecodedBenchmarkingResponse,
} from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getPageTitlesReportOptions } from '@/js/modules/analytics-4/utils/page-titles-report';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { addDays } from '@/js/util';
import { ErrorObject } from '@/js/util/errors';

interface FreshMetricsFigures {
	/** The number of visitors in the Total visitors report. */
	totalVisitors?: number;
	/** The clicks and impressions in the Search Console report. */
	searchPerformance?: SearchPerformanceTotals;
}

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
	/** The report of visitors for each channel, whose total is the visitors the columns count. */
	channels?: Report;
	/** The report of visitors for each site that referred them. */
	referrals?: Report;
}

export const LATEST_POST: RecentContentItem = {
	id: 12,
	title: 'Ice cream is good for your health',
	permalink: 'https://example.com/ice-cream/',
	pagePath: '/ice-cream/',
	publishedAt: '2026-09-17T12:30:00Z',
	sitePublishedAt: '2026-09-17T08:30:00',
};

export const EARLIER_POST: RecentContentItem = {
	id: 11,
	title: 'Sorbet is good for your health',
	permalink: 'https://example.com/sorbet/',
	pagePath: '/sorbet/',
	publishedAt: '2026-09-10T12:30:00Z',
	sitePublishedAt: '2026-09-10T08:30:00',
};

/**
 * An internal server error of a report request, which "Retry" can fix.
 *
 * @since 1.192.0
 */
export const INTERNAL_SERVER_ERROR: ErrorObject = {
	code: 'internal_server_error',
	message: 'Internal server error',
	data: { status: 500 },
};

/**
 * A rate limit error of an Analytics report request. The Analytics API names
 * no reason for a rate limit, so the status alone marks it.
 *
 * @since 1.192.0
 */
export const RATE_LIMIT_ERROR: ErrorObject = {
	code: 429,
	message: 'Exhausted property tokens per hour.',
	data: { status: 429, reason: '', cacheTTL: 600 },
};

/**
 * A permissions error of an Analytics report request, for a Google account
 * that can't read the Analytics property.
 *
 * @since 1.192.0
 */
export const INSUFFICIENT_PERMISSIONS_ERROR: ErrorObject = {
	code: 403,
	message: 'User does not have sufficient permissions for this property.',
	data: { status: 403, reason: 'insufficientPermissions' },
};

/**
 * The key factor cards of the design.
 *
 * @since n.e.x.t
 */
export const KEY_FACTORS: BenchmarkingKeyFactor[] = [
	{
		kind: 'CHANNEL',
		label: 'Referral',
		current: 245,
		previous: 180,
		sharePct: 52.4,
		attributes: [
			{
				kind: 'LANDING_PAGE',
				label: '/Ice-cream-is-good-for-your-health/',
				current: 46,
				previous: 30,
				sharePct: 12.9,
			},
			{
				kind: 'REFERRING_SITE',
				label: 'facebook.com',
				current: 92,
				previous: 60,
				sharePct: 25.8,
			},
		],
	},
	{
		kind: 'CHANNEL',
		label: 'Organic Video',
		current: 168,
		previous: 120,
		sharePct: 38.7,
		attributes: [
			{
				kind: 'LANDING_PAGE',
				label: '/Eat-ice-cream-every-day/',
				current: 53,
				previous: 30,
				sharePct: 18.5,
			},
			{
				kind: 'PLATFORM',
				label: 'YouTube',
				current: 72,
				previous: 60,
				sharePct: 9.7,
			},
		],
	},
	{
		kind: 'CHANNEL',
		label: 'Organic Search',
		current: 379,
		previous: 400,
		sharePct: 100,
		attributes: [
			{
				kind: 'LANDING_PAGE',
				label: '/best-ice-cream-shops-guide/',
				current: 38,
				previous: 40,
				sharePct: 9.5,
			},
			{
				kind: 'SEARCH_KEYWORD',
				label: 'healthy ice cream types',
				current: 17,
				previous: 20,
				sharePct: 14.3,
			},
		],
	},
];

/**
 * Gets the report arguments of `LATEST_POST` for the registry's reference date
 * and site URLs.
 *
 * @since 1.191.0
 * @since 1.192.0 Uses the registry's home URL and reference site URL.
 *
 * @param {Object} registry The registry with the reference date and the site URLs.
 * @return {Object} The post's permalink, its URL on the site that Site Kit reports on, and the post's date range.
 */
export function getLatestPostReportArgs(
	registry: WPDataRegistry
): PostReportArgs {
	return getPostReportArgs(
		LATEST_POST,
		registry.select( CORE_USER ).getReferenceDate(),
		registry.select( CORE_SITE ).getHomeURL(),
		registry.select( CORE_SITE ).getReferenceSiteURL()
	);
}

/**
 * Stores a post as the most recent post, so the latest post performance
 * section renders without a request.
 *
 * @since 1.191.0
 * @since 1.192.0 Takes an optional post.
 *
 * @param {Object} registry The registry to put the post in.
 * @param {Object} [post]   Optional. The post. Default `LATEST_POST`.
 * @return {void}
 */
export function provideLatestPost(
	registry: WPDataRegistry,
	post: RecentContentItem = LATEST_POST
) {
	provideRecentContent(
		registry,
		[ post ],
		LATEST_POST_RECENT_CONTENT_OPTIONS
	);
}

/**
 * Stores a report and marks its request as finished.
 *
 * @since 1.191.0
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
 * @since 1.191.0
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
 * @since 1.191.0
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
 * @since 1.191.0
 * @since 1.192.0 Requests the post's URL on the site that Site Kit reports on.
 *
 * @param {Object} registry The registry with the reference date and the site URLs.
 * @return {Object} The Search Console report options.
 */
export function getLatestPostKeywordReportOptions( registry: WPDataRegistry ) {
	return getTopKeywordReportOptions( getLatestPostReportArgs( registry ) );
}

/**
 * Stores the Search Console report of the latest post performance section for
 * `LATEST_POST`.
 *
 * @since 1.191.0
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
 * The visitors are strings, the way the API returns them. With `total`, the
 * report has its `totals` too, which count every value of the dimension, also
 * the values a `limit` leaves out of `rows`.
 *
 * @since 1.188.0
 * @since 1.189.0 Moved to a shared test helper.
 * @since 1.191.0 Takes an optional total.
 *
 * @param {Array<Array>} pairs   `[ label, visitors ]` pairs.
 * @param {number}       [total] Optional. The visitors of every value of the dimension. Without it, the report has no `totals`.
 * @return {Object} The breakdown report.
 */
export function createBreakdownReport(
	pairs: Array< [ string, number ] >,
	total?: number
): Report {
	return {
		rows: pairs.map( ( [ label, visitors ] ) => ( {
			dimensionValues: [ { value: label } ],
			metricValues: [ { value: String( visitors ) } ],
		} ) ),
		...( total === undefined
			? {}
			: {
					totals: [
						{
							dimensionValues: [ { value: 'RESERVED_TOTAL' } ],
							metricValues: [ { value: String( total ) } ],
						},
					],
			  } ),
	};
}

/**
 * Builds the values of a traffic breakdown column from label and visitor
 * pairs, in the order given.
 *
 * @since n.e.x.t
 *
 * @param {Array<Array>} pairs `[ label, visitors ]` pairs.
 * @return {Array<Object>} The column's values.
 */
export function createBreakdownValues(
	pairs: Array< [ string, number ] >
): TrafficBreakdownValue[] {
	return pairs.map( ( [ label, visitors ] ) => ( { label, visitors } ) );
}

/**
 * Builds a report of page titles from page path and title pairs, in the order
 * given.
 *
 * @since 1.191.0
 *
 * @param {Array<Array<string>>} pairs `[ pagePath, pageTitle ]` pairs.
 * @return {Object} The report of page titles.
 */
export function createTitlesReport(
	pairs: Array< [ string, string ] >
): Report {
	return {
		rows: pairs.map( ( [ pagePath, pageTitle ] ) => ( {
			dimensionValues: [ { value: pagePath }, { value: pageTitle } ],
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
 * @since 1.191.0
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
 * @since 1.191.0
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
 * Puts the report of the site's visitors over the reference date's Recent
 * activity date range in the store.
 *
 * With the "Total visitors" report of `provideFreshMetricsReports()` in the
 * store too, the tab counts the visitors without a request.
 *
 * @since 1.192.0
 *
 * @param {Object} registry The registry, with its reference date set.
 * @param {number} visitors The visitors over the date range.
 * @return {void}
 */
export function provideSiteVisitorsReport(
	registry: WPDataRegistry,
	visitors: number
) {
	const dateRange = getFreshDataDateRange(
		registry.select( CORE_USER ).getReferenceDate()
	);

	// A report without dimensions has one row, even when it counts no
	// visitors.
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			rows: [ { metricValues: [ { value: String( visitors ) } ] } ],
			totals: [ { metricValues: [ { value: String( visitors ) } ] } ],
		},
		{ options: getSiteVisitorsReportOptions( dateRange ) }
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
 * Puts the reports of the Recent activity tab's fresh figures in the store,
 * for the current time, so the figures render without sending a request.
 *
 * It always puts in the report that gives the `Asia/Tokyo` time zone of the
 * Analytics property, which the Total visitors report needs.
 *
 * @since 1.191.0
 *
 * @param {Object} registry                    The registry.
 * @param {Object} figures                     The figures the reports give.
 * @param {number} [figures.totalVisitors]     Optional. The number of visitors in the Total visitors report.
 * @param {Object} [figures.searchPerformance] Optional. The clicks and impressions in the Search Console report, which has them in the first hour of the window.
 * @return {void}
 */
export function provideFreshMetricsReports(
	registry: WPDataRegistry,
	{ totalVisitors, searchPerformance }: FreshMetricsFigures
) {
	// `FreshMetricsRow` counts the last 24 hours from the current time too.
	// eslint-disable-next-line sitekit/no-direct-date
	const windowStart = getFreshDataWindowStart( Date.now() );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			rows: [ { metricValues: [ { value: '0' } ] } ],
			metadata: { timeZone: 'Asia/Tokyo' },
		},
		{
			options: getTimeZoneReportOptions( windowStart ),
		}
	);

	if ( totalVisitors !== undefined ) {
		// A report without dimensions has one row, even when it counts no
		// visitors.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{ metricValues: [ { value: String( totalVisitors ) } ] },
				],
			},
			{
				options: getTotalVisitorsReportOptions(
					windowStart,
					'Asia/Tokyo'
				),
			}
		);
	}

	if ( searchPerformance ) {
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport(
			[
				{
					// This formats a fixed time, not the current one.
					// eslint-disable-next-line sitekit/no-direct-date
					keys: [ new Date( windowStart ).toISOString() ],
					...searchPerformance,
				},
			],
			{ options: getSearchPerformanceReportOptions( windowStart ) }
		);
	}
}

/**
 * Gets the options of the reports of the Recent activity tab's traffic
 * breakdown, for the registry's reference date.
 *
 * Each report leaves out the product pages that `getExcludedProducts()`
 * recognizes, the way the columns do.
 *
 * @since 1.191.0
 *
 * @param {Object} registry The registry, with its reference date and its site info set.
 * @return {Object} The options of the posts, channels, and referrals reports.
 */
export function getRecentTrafficBreakdownReportOptions(
	registry: WPDataRegistry
): RecentTrafficBreakdownReportOptions {
	const dateRange = getFreshDataDateRange(
		registry.select( CORE_USER ).getReferenceDate()
	);
	const excludedProducts = registry
		.select( MODULES_ANALYTICS_4 )
		.getExcludedProducts();

	return {
		posts: getTopPostsReportOptions( dateRange, excludedProducts ),
		channels: getTopChannelsReportOptions( dateRange, excludedProducts ),
		referrals: getTopReferralsReportOptions( dateRange, excludedProducts ),
	};
}

/**
 * Puts the given reports of the Recent activity tab's traffic breakdown in the
 * store, so the breakdown renders without sending a request. When
 * `reports.posts` is given, the report of titles that the posts column
 * requests goes in the store too.
 *
 * @since 1.191.0
 *
 * @param {Object} registry             The registry, with its reference date and its site info set.
 * @param {Object} reports              The reports.
 * @param {Object} [reports.posts]      Optional. The report of visitors for each page path.
 * @param {Object} [reports.postTitles] Optional. The title of each page path. A path with no title here has none in the report of titles.
 * @param {Object} [reports.channels]   Optional. The report of visitors for each channel, whose total is the visitors the columns count.
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
		receiveGetReport( posts, { options: reportOptions.posts } );

		const pagePaths = getRecentTrafficBreakdownRows( posts ).map(
			( { label } ) => label
		);

		if ( pagePaths.length ) {
			receiveGetReport(
				createTitlesReport(
					pagePaths
						.filter( ( pagePath ) => postTitles[ pagePath ] )
						.map( ( pagePath ): [ string, string ] => [
							pagePath,
							postTitles[ pagePath ],
						] )
				),
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

/**
 * Gets a matcher for the Analytics report requests that ask for exactly the
 * given dimensions.
 *
 * @since 1.191.0
 *
 * @param {...string} dimensions The dimension names, in order.
 * @return {Function} The matcher, for `fetchMock`.
 */
export function forDimensions( ...dimensions: string[] ) {
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	return ( url: string ) =>
		reportEndpoint.test( url ) &&
		isEqual(
			map(
				getQueryArg( url, 'dimensions' ) as
					| Array< { name: string } >
					| undefined,
				'name'
			),
			dimensions
		);
}

/** The endpoint that `setExpirableItemTimers()` posts to. */
export const setExpirableItemTimersEndpoint = new RegExp(
	'^/google-site-kit/v1/core/user/data/set-expirable-item-timers'
);

/**
 * Gets the slugs of the timers in the requests to the endpoint that
 * `setExpirableItemTimers()` posts to, in the order they were sent.
 *
 * @since 1.192.0
 *
 * @return {Array<string>} The timer slugs.
 */
export function requestedTimerSlugs(): string[] {
	return fetchMock
		.calls( setExpirableItemTimersEndpoint )
		.flatMap( ( call ) =>
			JSON.parse( String( call[ 1 ]?.body ) ).data.map(
				( { slug }: { slug: string } ) => slug
			)
		);
}

interface RecentActivitySurveyState {
	/** The expirable items, as expiry times in seconds, keyed by slug. */
	expirableItems?: Record< string, number >;
	/** The dismissed prompts, keyed by slug. */
	dismissedPrompts?: Record< string, { expires: number; count: number } >;
}

/**
 * Gets the expiry time of an expirable item, in seconds, a number of seconds
 * from now.
 *
 * @since 1.192.0
 *
 * @param {number} secondsFromNow The seconds from now, negative for a time in the past.
 * @return {number} The expiry time, in seconds since the epoch.
 */
export function getExpiryFromNow( secondsFromNow: number ): number {
	// `isExpirableItemActive()` compares the expiry with the current time,
	// not the reference date.
	// eslint-disable-next-line sitekit/no-direct-date
	return Math.floor( Date.now() / 1000 ) + secondsFromNow;
}

/**
 * Stores the expirable items and the dismissed prompts that the Recent
 * activity survey triggers read, so the store sends no request for them.
 *
 * @since 1.192.0
 *
 * @param {Object} registry                 The registry to put the state in.
 * @param {Object} [state]                  Optional. The state to put in the store.
 * @param {Object} [state.expirableItems]   Optional. The expirable items. Default `{}`.
 * @param {Object} [state.dismissedPrompts] Optional. The dismissed prompts. Default `{}`.
 * @return {void}
 */
export function provideRecentActivitySurveyState(
	registry: WPDataRegistry,
	{
		expirableItems = {},
		dismissedPrompts = {},
	}: RecentActivitySurveyState = {}
) {
	registry.dispatch( CORE_USER ).receiveGetExpirableItems( expirableItems );
	registry
		.dispatch( CORE_USER )
		.receiveGetDismissedPrompts( dismissedPrompts );
}

/**
 * Gives each day the typical range the design draws: a quarter below and above
 * the average of the seven days centered on it, and at least 5 visits either
 * way, so the band follows the line.
 *
 * @since n.e.x.t
 *
 * @param {Array.<Object>} dailyTraffic The visits on each day, oldest first.
 * @return {Array.<Object>} The same days, each with the bounds of its typical range.
 */
export function addTypicalTrafficRange(
	dailyTraffic: BenchmarkingDailyTrafficRow[]
): BenchmarkingDailyTrafficRow[] {
	return dailyTraffic.map( ( day, index ) => {
		const week = dailyTraffic.slice( Math.max( 0, index - 3 ), index + 4 );
		const average =
			week.reduce( ( total, { visits } ) => total + visits, 0 ) /
			week.length;
		const margin = Math.max( average / 4, 5 );

		return {
			...day,
			expectedMin: Math.max( 0, Math.round( average - margin ) ),
			expectedMax: Math.round( average + margin ),
		};
	} );
}

/**
 * Builds a decoded benchmarking response with the figures of the design: its
 * total visits, its visits and typical range on each day of the date range,
 * and its key factor cards.
 *
 * @since n.e.x.t
 *
 * @param {string} startDate The first day of the date range, as `YYYY-MM-DD`.
 * @param {string} endDate   The last day of the date range, as `YYYY-MM-DD`.
 * @return {Object} The decoded response.
 */
export function createBenchmarkingResponse(
	startDate: string,
	endDate: string
): DecodedBenchmarkingResponse {
	return {
		visits: PLACEHOLDER_TOTAL_VISITS,
		dailyTraffic: addTypicalTrafficRange(
			getPlaceholderDailyTraffic( startDate, endDate )
		),
		// The site recorded traffic on every day of the year of history the
		// response reads, so every day of the range has a typical range.
		firstTrafficDate: addDays( startDate, -364 ),
		keyFactors: KEY_FACTORS,
	};
}

/**
 * Stores a benchmarking response for the selected date range, so the Traffic
 * overview panel renders it without a request.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry   The registry with the selected date range.
 * @param {Object} [response] Optional. The decoded response to store. Default is the response `createBenchmarkingResponse()` builds for the range.
 * @return {void}
 */
export function provideBenchmarkingResponse(
	registry: WPDataRegistry,
	response?: DecodedBenchmarkingResponse
) {
	const { startDate, endDate } = registry
		.select( CORE_USER )
		.getDateRangeDates();

	provideBenchmarkingData(
		registry,
		{ startDate, endDate },
		response ?? createBenchmarkingResponse( startDate, endDate )
	);
}

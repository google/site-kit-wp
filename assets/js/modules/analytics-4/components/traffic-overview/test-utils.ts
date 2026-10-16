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
	getSiteTotalsReportOptions,
	getTopChannelsReportOptions,
	getTopPostsReportOptions,
	getTopReferralsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { getRecentTrafficBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getRecentTrafficBreakdownRows';
import {
	getComparisonDateRange,
	getDateDimensionValues,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/insight';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import { getPageTitlesReportOptions } from '@/js/modules/analytics-4/utils/page-titles-report';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { provideModules, provideSiteInfo } from '@tests/js/utils';

export interface RecentTrafficBreakdownReportOptions {
	/** The options of the "Top posts by visitors" report. */
	posts: ReportOptions;
	/** The options of the "Top channels by visitors" report. */
	channels: ReportOptions;
	/** The options of the "Top referrals by visitors" report. */
	referrals: ReportOptions;
	/** The options of the report of the site's totals, which each share is a percentage of. */
	siteTotals: ReportOptions;
}

export interface SiteTotals {
	/** The site's visits over the date range, which each share in the channels and referrals columns is a percentage of. */
	visits: number;
	/** The site's views over the date range, which each share in the posts column is a percentage of. */
	views: number;
}

export interface RecentTrafficBreakdownReports {
	/** The report of views for each page path. */
	posts?: Report;
	/** The title of each page path, for the pages the posts column shows. */
	postTitles?: Record< string, string >;
	/** The report of visits for each channel. */
	channels?: Report;
	/** The report of visits for each site that referred them. */
	referrals?: Report;
	/** The site's visits and views over the date range, which each share is a percentage of. */
	siteTotals?: SiteTotals;
}

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
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetRecentContent( [ LATEST_POST ], {
			...LATEST_POST_RECENT_CONTENT_OPTIONS,
			includeProducts: false,
		} );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getRecentContent', [
			LATEST_POST_RECENT_CONTENT_OPTIONS,
		] );
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
 * Builds a report of page titles from page path and title pairs, in the order
 * given.
 *
 * @since n.e.x.t
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
 * Builds a report of the site's visits and views, with no dimension.
 *
 * The report has the visits and the views in its one row and in its total,
 * in the order of `getSiteTotalsReportOptions()`. Each is a string, the way the
 * API returns it.
 *
 * @since n.e.x.t
 *
 * @param {Object} siteTotals        The site's totals.
 * @param {number} siteTotals.visits The site's visits.
 * @param {number} siteTotals.views  The site's views.
 * @return {Object} The report of the site's totals.
 */
export function createSiteTotalsReport( {
	visits,
	views,
}: SiteTotals ): Report {
	const metricValues = [
		{ value: String( visits ) },
		{ value: String( views ) },
	];

	return {
		rows: [ { metricValues } ],
		totals: [ { metricValues } ],
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
 * Gets the options of the reports of the Recent activity tab's traffic
 * breakdown, for the registry's reference date.
 *
 * The posts report follows the site's permalink structure, and leaves out the
 * product pages that `getExcludedProducts()` recognizes, the way the posts
 * column does.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry, with its reference date and its site info set.
 * @return {Object} The options of the posts, channels, and referrals reports, and of the report of the site's totals.
 */
export function getRecentTrafficBreakdownReportOptions(
	registry: WPDataRegistry
): RecentTrafficBreakdownReportOptions {
	const dateRange = getFreshDataDateRange(
		registry.select( CORE_USER ).getReferenceDate()
	);

	return {
		posts: getTopPostsReportOptions( dateRange, {
			usingPlainPermalinks: registry
				.select( CORE_SITE )
				.isUsingPlainPermalinks(),
			excludedProducts: registry
				.select( MODULES_ANALYTICS_4 )
				.getExcludedProducts(),
		} ),
		channels: getTopChannelsReportOptions( dateRange ),
		referrals: getTopReferralsReportOptions( dateRange ),
		siteTotals: getSiteTotalsReportOptions( dateRange ),
	};
}

/**
 * Puts the given reports of the Recent activity tab's traffic breakdown in the
 * store, so the breakdown renders without sending a request. When
 * `reports.posts` is given, the report of titles that the posts column
 * requests goes in the store too, for a site with a permalink structure.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry             The registry, with its reference date and its site info set.
 * @param {Object} reports              The reports.
 * @param {Object} [reports.posts]      Optional. The report of views for each page path.
 * @param {Object} [reports.postTitles] Optional. The title of each page path. A path with no title here has none in the report of titles.
 * @param {Object} [reports.channels]   Optional. The report of visits for each channel.
 * @param {Object} [reports.referrals]  Optional. The report of visits for each site that referred them.
 * @param {Object} [reports.siteTotals] Optional. The site's visits and views over the date range.
 * @return {void}
 */
export function provideRecentTrafficBreakdownReports(
	registry: WPDataRegistry,
	{
		posts,
		postTitles = {},
		channels,
		referrals,
		siteTotals,
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

	if ( siteTotals ) {
		receiveGetReport( createSiteTotalsReport( siteTotals ), {
			options: reportOptions.siteTotals,
		} );
	}
}

/**
 * Puts the module list, the site info, and the Analytics settings in the
 * store. The selectors that decide whether to include products read them.
 *
 * @since n.e.x.t
 *
 * @param {Object}  registry                          The registry to put the state in.
 * @param {Object}  [state]                           Optional. The state to put in the store.
 * @param {boolean} [state.analyticsConnected]        Optional. Whether Analytics is connected. Default `true`.
 * @param {boolean} [state.wooCommerceActive]         Optional. Whether WooCommerce is active. Default `true`.
 * @param {boolean} [state.setting]                   Optional. Whether the setting to include products is on. Default `true`.
 * @param {string}  [state.productPostType]           Optional. The product post type. Default `product`.
 * @param {string}  [state.productPathPrefix]         Optional. The path that product URLs start with. Default `null`.
 * @param {string}  [state.productQueryVar]           Optional. The query var of the product post type. Default `product`.
 * @param {boolean} [state.usingPlainPermalinks]      Optional. Whether the site uses plain permalinks. Default `false`.
 * @param {Array}   [state.availableCustomDimensions] Optional. The custom dimensions that the Analytics property has, or `null` when they haven't been synced. Default `undefined`, which the store reads as not loaded yet.
 * @return {void}
 */
export function receiveState(
	registry: WPDataRegistry,
	{
		analyticsConnected = true,
		wooCommerceActive = true,
		setting = true,
		productPostType = 'product',
		productPathPrefix = null,
		productQueryVar = 'product',
		usingPlainPermalinks = false,
		availableCustomDimensions,
	}: {
		analyticsConnected?: boolean;
		wooCommerceActive?: boolean;
		setting?: boolean;
		productPostType?: string | null;
		productPathPrefix?: string | null;
		productQueryVar?: string | null;
		usingPlainPermalinks?: boolean;
		availableCustomDimensions?: string[] | null;
	} = {}
) {
	provideModules( registry, [
		{
			slug: MODULE_SLUG_ANALYTICS_4,
			active: true,
			connected: analyticsConnected,
		},
	] );

	provideSiteInfo( registry, {
		wooCommerceActive,
		productPostType,
		productPathPrefix,
		productQueryVar,
		usingPlainPermalinks,
	} );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
		[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: setting,
		availableCustomDimensions,
	} );
}

/**
 * Gets a matcher for the Analytics report requests that ask for exactly the
 * given dimensions.
 *
 * @since n.e.x.t
 *
 * @param {...string} dimensions The dimension names, in order. With none, the matcher matches a report request with no dimension.
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

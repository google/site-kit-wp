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
	PostReportArgs,
	getEngagementReportOptions,
	getPurchasesReportOptions,
	getTopChannelReportOptions,
	getTopKeywordReportOptions,
	getTopReferrerReportOptions,
	getVisitorsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/postReportOptions';
import { getPostWindow } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getPostWindow';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';

export const LATEST_POST: RecentContentItem = {
	id: 12,
	title: 'Ice cream is good for your health',
	permalink: 'https://example.com/ice-cream/',
	pagePath: '/ice-cream/',
	publishedAt: '2026-09-17T12:30:00Z',
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
	return {
		permalink: LATEST_POST.permalink,
		...getPostWindow(
			LATEST_POST.publishedAt,
			registry.select( CORE_USER ).getReferenceDate()
		),
	};
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
			count: 1,
			includeProducts: false,
		} );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getRecentContent', [ { count: 1 } ] );
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
 * Stores the Analytics reports of the latest post performance section for
 * `LATEST_POST`, including its purchases report.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to put the reports in.
 * @return {void}
 */
export function provideLatestPostAnalyticsReports( registry: WPDataRegistry ) {
	const reportArgs = getLatestPostReportArgs( registry );

	const reports: Array< [ ReportOptions, Report ] > = [
		[
			getVisitorsReportOptions( reportArgs ),
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
		[
			getTopChannelReportOptions( reportArgs ),
			createBreakdownReport( [ [ 'Organic Social', 41 ] ] ),
		],
		[
			getTopReferrerReportOptions( reportArgs ),
			createBreakdownReport( [ [ 'substack.com', 23 ] ] ),
		],
		[
			getEngagementReportOptions( reportArgs ),
			{
				rows: [
					{ metricValues: [ { value: '76' }, { value: '18' } ] },
				],
			},
		],
		[
			getPurchasesReportOptions( reportArgs ),
			createBreakdownReport( [ [ 'purchase', 4 ] ] ),
		],
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

/**
 * Recent activity latest post report options.
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
 * Internal dependencies
 */
import { ENUM_CONVERSION_EVENTS } from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { PostWindow } from './utils/getPostWindow';

export interface PostReportArgs extends PostWindow {
	/** The URL of the post, e.g. `https://example.com/hello-world/`. */
	permalink: string;
}

export interface SearchConsoleReportOptions extends PostWindow {
	/** The dimension to group the report rows by, e.g. `query`. */
	dimensions: string;
	/** The URL of the page to report on. */
	url: string;
	/** The maximum number of rows. */
	limit: number;
	/** The ID that names the report in the request. */
	reportID: string;
}

/**
 * Gets the dimension filter that matches the views of a post.
 *
 * A plain permalink, e.g. `/?p=42`, identifies the post by its query string,
 * so it is matched by its path and query string. Any other permalink is matched
 * by its path alone, so a view with campaign parameters still counts.
 *
 * @since n.e.x.t
 *
 * @param {string}  permalink                  The URL of the post.
 * @param {Object}  [options]                  Options.
 * @param {boolean} [options.matchLandingPage] Whether to match the page the session started on, rather than the page of the event.
 * @return {Object} The dimension filter.
 */
function getPostFilter(
	permalink: string,
	{ matchLandingPage = false }: { matchLandingPage?: boolean } = {}
): Record< string, string > {
	const { pathname, search } = new URL( permalink );

	if ( search ) {
		const dimension = matchLandingPage
			? 'landingPagePlusQueryString'
			: 'pagePathPlusQueryString';

		return { [ dimension ]: `${ pathname }${ search }` };
	}

	return { [ matchLandingPage ? 'landingPage' : 'pagePath' ]: pathname };
}

/**
 * Gets the options of the report that counts the post's visitors, split into
 * new and returning visitors. The report's totals hold the total visitors.
 *
 * @since n.e.x.t
 *
 * @param {Object} args The post's permalink and date range.
 * @return {Object} The Analytics report options.
 */
export function getVisitorsReportOptions(
	args: PostReportArgs
): ReportOptions {
	return {
		startDate: args.startDate,
		endDate: args.endDate,
		dimensions: [ 'newVsReturning' ],
		dimensionFilters: {
			...getPostFilter( args.permalink ),
			newVsReturning: [ 'new', 'returning' ],
		},
		metrics: [ { name: 'totalUsers' } ],
		reportID: 'analytics-4_latest-post-performance_visitors',
	};
}

/**
 * Gets the options of the report that finds the channel that brought the post
 * the most visitors.
 *
 * @since n.e.x.t
 *
 * @param {Object} args The post's permalink and date range.
 * @return {Object} The Analytics report options.
 */
export function getTopChannelReportOptions(
	args: PostReportArgs
): ReportOptions {
	return {
		startDate: args.startDate,
		endDate: args.endDate,
		dimensions: [ 'sessionDefaultChannelGroup' ],
		dimensionFilters: getPostFilter( args.permalink ),
		metrics: [ { name: 'totalUsers' } ],
		orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
		limit: 1,
		reportID: 'analytics-4_latest-post-performance_top-channel',
	};
}

/**
 * Gets the options of the report that finds the referring site that brought
 * the post the most visitors.
 *
 * @since n.e.x.t
 *
 * @param {Object} args The post's permalink and date range.
 * @return {Object} The Analytics report options.
 */
export function getTopReferrerReportOptions(
	args: PostReportArgs
): ReportOptions {
	return {
		startDate: args.startDate,
		endDate: args.endDate,
		dimensions: [ 'sessionSource' ],
		dimensionFilters: {
			...getPostFilter( args.permalink ),
			sessionDefaultChannelGroup: 'Referral',
		},
		metrics: [ { name: 'totalUsers' } ],
		orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
		limit: 1,
		reportID: 'analytics-4_latest-post-performance_top-referrer',
	};
}

/**
 * Gets the options of the report that measures the post's average session
 * duration and its engaged sessions.
 *
 * @since n.e.x.t
 *
 * @param {Object} args The post's permalink and date range.
 * @return {Object} The Analytics report options.
 */
export function getEngagementReportOptions(
	args: PostReportArgs
): ReportOptions {
	return {
		startDate: args.startDate,
		endDate: args.endDate,
		dimensionFilters: getPostFilter( args.permalink ),
		metrics: [
			{ name: 'averageSessionDuration' },
			{ name: 'engagedSessions' },
		],
		reportID: 'analytics-4_latest-post-performance_engagement',
	};
}

/**
 * Gets the options of the report that counts the purchases in the sessions
 * that started on the post.
 *
 * A purchase event is sent from the checkout page, so the report filters by
 * the page the session started on rather than by the page of the event.
 *
 * @since n.e.x.t
 *
 * @param {Object} args The post's permalink and date range.
 * @return {Object} The Analytics report options.
 */
export function getPurchasesReportOptions(
	args: PostReportArgs
): ReportOptions {
	return {
		startDate: args.startDate,
		endDate: args.endDate,
		dimensions: [ 'eventName' ],
		dimensionFilters: {
			...getPostFilter( args.permalink, { matchLandingPage: true } ),
			eventName: ENUM_CONVERSION_EVENTS.PURCHASE,
		},
		metrics: [ { name: 'eventCount' } ],
		reportID: 'analytics-4_latest-post-performance_purchases',
	};
}

/**
 * Gets the options of the Search Console report that finds the search query
 * that brought the post the most clicks.
 *
 * @since n.e.x.t
 *
 * @param {Object} args The post's permalink and date range.
 * @return {Object} The Search Console report options.
 */
export function getTopKeywordReportOptions(
	args: PostReportArgs
): SearchConsoleReportOptions {
	return {
		startDate: args.startDate,
		endDate: args.endDate,
		dimensions: 'query',
		url: args.permalink,
		limit: 1,
		reportID: 'search-console_latest-post-performance_top-keyword',
	};
}

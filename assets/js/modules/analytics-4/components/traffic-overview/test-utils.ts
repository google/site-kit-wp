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
import { getFreshDataDateRange } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import {
	getTopChannelsReportOptions,
	getTopPostsReportOptions,
	getTopReferralsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { getRecentTrafficBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getRecentTrafficBreakdownRows';
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

/**
 * Gets the options of the three reports of the Recent activity tab's traffic
 * breakdown.
 *
 * The options cover the date range of the tab for the registry's reference
 * date, the one `useFreshDataDateRange` returns.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry, with its reference date set.
 * @return {Object} The options of the posts, channels and referrals reports.
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
 * Puts the reports of the Recent activity tab's traffic breakdown in the
 * store, so the breakdown renders without sending a request.
 *
 * Each report is left out when it isn't given. With the posts report, the
 * function also puts in the report of titles that the posts column asks for,
 * which has a title for each page path of the posts the column shows.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry             The registry, with its reference date set.
 * @param {Object} reports              The reports.
 * @param {Object} [reports.posts]      The report of visitors for each page path.
 * @param {Object} [reports.postTitles] The title of each page path. A path with no title here gets none in the report of titles.
 * @param {Object} [reports.channels]   The report of visitors for each channel.
 * @param {Object} [reports.referrals]  The report of visitors for each site that referred them.
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

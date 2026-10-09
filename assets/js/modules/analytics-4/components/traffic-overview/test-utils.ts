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
import { FreshDataDateRange } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import {
	getRecentTopChannelsReportArgs,
	getRecentTopPostsReportArgs,
	getRecentTopReferralsReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { getPageTitlesReportOptions } from '@/js/modules/analytics-4/utils/page-titles-report';

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
 * Puts the reports of the "What’s affecting recent traffic?" section of the
 * Recent activity tab in the store, with the titles of its three top posts,
 * so a story renders the section without a report request.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry  The registry to put the reports in.
 * @param {Object} dateRange The date range of the Recent activity tab.
 * @return {void}
 */
export function provideRecentTrafficBreakdownReports(
	registry: WPDataRegistry,
	dateRange: FreshDataDateRange
) {
	const topPostsReportArgs = getRecentTopPostsReportArgs( dateRange );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		createBreakdownReport( [
			[ '/ice-cream-is-good-for-your-health/', 82 ],
			[ '/use-spf-everyday/', 21 ],
			[ '/stay-hydrated/', 8 ],
			[ '/summer-reading-list/', 6 ],
			[ '/about/', 4 ],
		] ),
		{ options: topPostsReportArgs }
	);
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			rows: [
				[
					'/ice-cream-is-good-for-your-health/',
					'Ice cream is good for your health',
				],
				[ '/use-spf-everyday/', 'Use SPF everyday, even for short' ],
				[ '/stay-hydrated/', 'Stay hydrated' ],
			].map( ( [ pagePath, pageTitle ] ) => ( {
				dimensionValues: [ { value: pagePath }, { value: pageTitle } ],
			} ) ),
		},
		{
			options: getPageTitlesReportOptions( topPostsReportArgs, [
				'/ice-cream-is-good-for-your-health/',
				'/use-spf-everyday/',
				'/stay-hydrated/',
			] ),
		}
	);
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		createBreakdownReport( [
			[ 'Direct', 82 ],
			[ 'Organic Search', 21 ],
			[ 'Organic Social', 8 ],
			[ 'Referral', 5 ],
			[ 'Email', 2 ],
		] ),
		{ options: getRecentTopChannelsReportArgs( dateRange ) }
	);
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		createBreakdownReport( [
			[ 'substack.com', 82 ],
			[ 'reddit.com', 21 ],
			[ 'medium.com', 8 ],
			[ 'news.ycombinator.com', 3 ],
		] ),
		{ options: getRecentTopReferralsReportArgs( dateRange ) }
	);
}

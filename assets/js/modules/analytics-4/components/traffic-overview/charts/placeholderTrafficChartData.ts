/**
 * Traffic Overview chart placeholder data.
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
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { getDateString } from '@/js/util';
import {
	PublishedPost,
	TypicalTrafficRangeDay,
	getReportPoints,
} from './getTrafficChartData';

/**
 * The placeholder posts: how far through the plotted days each one sits, as
 * in the design, and its title, which names the landing page of a placeholder
 * key factor card.
 */
const PLACEHOLDER_POSTS = [
	{ position: 0.12, title: 'Ice cream is good for your health' },
	{ position: 0.48, title: 'Eat ice cream every day' },
	{ position: 0.75, title: 'The best ice cream shops guide' },
];

/**
 * Gets the typical range the Traffic Overview chart draws until it reads the
 * range from the benchmarking response.
 *
 * Each day's range runs a quarter below and above the average of the seven
 * days centered on it, and at least 5 visitors either way, so the band
 * follows the line, as in the design.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report] Optional. The daily-visitors report.
 * @return {Array.<Object>} One range for each day of the report.
 */
export function getPlaceholderTypicalTrafficRange(
	report?: Report
): TypicalTrafficRangeDay[] {
	const points = getReportPoints( report?.rows ?? [] );

	return points.map( ( [ date ], index ) => {
		const week = points.slice( Math.max( 0, index - 3 ), index + 4 );
		const average =
			week.reduce( ( total, [ , visitors ] ) => total + visitors, 0 ) /
			week.length;
		const margin = Math.max( average / 4, 5 );

		return {
			date: getDateString( date ),
			min: Math.max( 0, Math.round( average - margin ) ),
			max: Math.round( average + margin ),
		};
	} );
}

/**
 * Gets the posts the Traffic Overview chart marks until it reads the posts
 * the site published.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report] Optional. The daily-visitors report.
 * @return {Array.<Object>} Three posts on days of the report, or none when the report has no days.
 */
export function getPlaceholderPublishedPosts(
	report?: Report
): PublishedPost[] {
	const points = getReportPoints( report?.rows ?? [] );

	if ( ! points.length ) {
		return [];
	}

	return PLACEHOLDER_POSTS.map( ( { position, title } ) => {
		const [ date ] =
			points[ Math.round( position * ( points.length - 1 ) ) ];

		return { date: getDateString( date ), title };
	} );
}

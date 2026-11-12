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
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getDateString, stringToDate } from '@/js/util';
import { PublishedPost } from './getTrafficChartData';

/**
 * The visits the design plots for each of its 28 days, oldest first. They
 * climb from about 40 a day to about 150, with a dip under the first post.
 */
const PLACEHOLDER_DAILY_VISITS = [
	39, 33, 66, 25, 42, 41, 72, 39, 44, 38, 31, 57, 36, 55, 87, 66, 73, 61, 76,
	84, 70, 112, 134, 121, 145, 71, 141, 152,
];

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
 * Gets the visits the Traffic Overview chart plots where the panel reads no
 * benchmarking response.
 *
 * The design's 28 days of visits stretch or shrink to cover the range, so the
 * line keeps the design's shape over a range of any length. No day has a
 * typical range.
 *
 * @since n.e.x.t
 *
 * @param {string} startDate The range's first day, as `YYYY-MM-DD`.
 * @param {string} endDate   The range's last day, as `YYYY-MM-DD`.
 * @return {Array.<Object>} One row for each day of the range, oldest first, each with null bounds.
 */
export function getPlaceholderDailyTraffic(
	startDate: string,
	endDate: string
): BenchmarkingDailyTrafficRow[] {
	const dates: string[] = [];

	// The date walks a day at a time, like the dates of the decoded response,
	// so a daylight-saving change inside the range skips no day.
	for (
		const date = stringToDate( startDate );
		getDateString( date ) <= endDate;
		date.setDate( date.getDate() + 1 )
	) {
		dates.push( getDateString( date ) );
	}

	const lastPosition = PLACEHOLDER_DAILY_VISITS.length - 1;

	return dates.map( ( date, index ) => {
		// How far through the design's days the day sits. A day between two of
		// them takes a value on the straight line between theirs.
		const position =
			dates.length > 1
				? ( index * lastPosition ) / ( dates.length - 1 )
				: lastPosition;
		const before = PLACEHOLDER_DAILY_VISITS[ Math.floor( position ) ];
		const after = PLACEHOLDER_DAILY_VISITS[ Math.ceil( position ) ];

		return {
			date,
			visits: Math.round(
				before +
					( position - Math.floor( position ) ) * ( after - before )
			),
			expectedMin: null,
			expectedMax: null,
		};
	} );
}

/**
 * Gets the posts the Traffic Overview chart marks until it reads the posts
 * the site published.
 *
 * @since n.e.x.t
 *
 * @param {Array.<Object>} [dailyTraffic] Optional. The visits on each day, oldest first.
 * @return {Array.<Object>} Three posts on days of the daily traffic, or none when it has no days.
 */
export function getPlaceholderPublishedPosts(
	dailyTraffic: BenchmarkingDailyTrafficRow[] = []
): PublishedPost[] {
	if ( ! dailyTraffic.length ) {
		return [];
	}

	return PLACEHOLDER_POSTS.map( ( { position, title } ) => ( {
		date: dailyTraffic[
			Math.round( position * ( dailyTraffic.length - 1 ) )
		].date,
		title,
	} ) );
}

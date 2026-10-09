/**
 * Recent activity `getPostWindow` utility.
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
import { getDateString, getPreviousDate } from '@/js/util';

export interface PostWindow {
	/** The day before the post was published, e.g. `2026-09-23`. */
	startDate: string;
	/** The reference date, e.g. `2026-10-08`. */
	endDate: string;
}

/**
 * Gets the date range of the reports about a post, from the day before the
 * post was published to the reference date.
 *
 * Analytics reports dates in the property's time zone, which can be behind the
 * browser's time zone. Starting a day early keeps the publish day in the range
 * in either time zone, and adds no traffic, since the post had none before it
 * was published.
 *
 * @since n.e.x.t
 *
 * @param {string} publishedAt   The publish time in ISO 8601 format, e.g. `2026-09-24T14:05:00Z`.
 * @param {string} referenceDate The reference date, e.g. `2026-10-08`.
 * @return {Object} The `startDate` and the `endDate` of the date range.
 */
export function getPostWindow(
	publishedAt: string,
	referenceDate: string
): PostWindow {
	const startDate = getPreviousDate(
		// eslint-disable-next-line sitekit/no-direct-date -- The date comes from the post's publish time, not from the reference date.
		getDateString( new Date( publishedAt ) ),
		1
	);

	return {
		// A reference date before the publish day would otherwise give a range
		// that ends before it starts.
		startDate: startDate < referenceDate ? startDate : referenceDate,
		endDate: referenceDate,
	};
}

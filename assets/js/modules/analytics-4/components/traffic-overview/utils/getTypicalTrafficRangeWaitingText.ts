/**
 * Traffic Overview `getTypicalTrafficRangeWaitingText` utility.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { formatDate } from '@/js/util';

/**
 * Gets the text of the notice that says when the chart will draw the typical
 * traffic range, while the site's history is too short for it.
 *
 * The range shows from the last day of the first date range of this length
 * with enough history, `availableFrom`. A range that ends today reaches it on
 * that day, so a later day says when to check back. A day that has passed
 * means the selected range ends in the past, before it, so the notice asks for
 * a range that ends on that day or later. Without the day, the site has no
 * recorded traffic up to the end of the selected range, and the notice says
 * only that its history is too short.
 *
 * @since n.e.x.t
 *
 * @param {string|null} availableFrom The last day of the first date range of this length with the typical traffic range, as `YYYY-MM-DD`, or null when the site has no recorded traffic up to the end of the selected range.
 * @param {string}      referenceDate Today, as `YYYY-MM-DD`.
 * @return {string} The notice's text.
 */
export function getTypicalTrafficRangeWaitingText(
	availableFrom: string | null,
	referenceDate: string
): string {
	if ( ! availableFrom ) {
		return __(
			'There isn’t enough traffic history for a typical traffic range on these dates.',
			'google-site-kit'
		);
	}

	const date = formatDate( availableFrom, { month: 'long' } );

	if ( availableFrom > referenceDate ) {
		return sprintf(
			/* translators: %s: the first day the typical traffic range shows, such as "April 2, 2025" */
			__(
				'We’re still learning what’s usual for your site. Check back on %s to see your typical traffic range.',
				'google-site-kit'
			),
			date
		);
	}

	return sprintf(
		/* translators: %s: the last day of the first date range of this length with a typical traffic range, such as "April 2, 2025" */
		__(
			'There isn’t enough traffic history for a typical traffic range on these dates. Select a date range that ends on or after %s to see it.',
			'google-site-kit'
		),
		date
	);
}

/**
 * `getAvailableDateRanges` utility.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Gets the hash of available date ranges.
 *
 * @since 1.12.0
 *
 * @return {Object} The object hash where every key is a date range slug, and the value is an object with the date range slug and its translation.
 */
export function getAvailableDateRanges() {
	const label = ( days ) =>
		sprintf(
			/* translators: %s: number of days */
			_n( 'Last %s day', 'Last %s days', days, 'google-site-kit' ),
			days
		);

	return {
		'last-7-days': {
			slug: 'last-7-days',
			label: label( 7 ),
			days: 7,
		},
		'last-14-days': {
			slug: 'last-14-days',
			label: label( 14 ),
			days: 14,
		},
		'last-28-days': {
			slug: 'last-28-days',
			label: label( 28 ),
			days: 28,
		},
		'last-90-days': {
			slug: 'last-90-days',
			label: label( 90 ),
			days: 90,
		},
	};
}

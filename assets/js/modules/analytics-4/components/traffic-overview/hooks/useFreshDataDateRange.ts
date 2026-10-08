/**
 * Traffic Overview `useFreshDataDateRange` hook.
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
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getPreviousDate, stringToDate } from '@/js/util';

export interface FreshDataDateRange {
	/** The first day of the date range, e.g. `2025-02-04`. */
	startDate: string;
	/** The last day of the date range, which is the reference date, e.g. `2025-02-05`. */
	endDate: string;
}

/**
 * Gets the date range of the Recent activity tab.
 *
 * The date range runs from the day before the reference date to the reference
 * date, and stays the same when the user selects another date range for the
 * dashboard.
 *
 * The reference date is a date in the browser's time zone. When the site's
 * time zone is behind the browser's time zone, the site's yesterday is two
 * days before the reference date for part of each day, so the date range
 * starts two days before the reference date. The date range also starts two
 * days before the reference date when the site uses a UTC offset or a time
 * zone the browser doesn't know, because the site's time zone might then be
 * behind the browser's time zone.
 *
 * @since n.e.x.t
 *
 * @return {Object} The `startDate` and the `endDate` of the date range.
 */
export function useFreshDataDateRange(): FreshDataDateRange {
	const referenceDate = useSelect(
		( select: Select ) => select( CORE_USER ).getReferenceDate(),
		[]
	);

	const timezone = useSelect(
		( select: Select ) => select( CORE_SITE ).getTimezone(),
		[]
	);

	return useMemo( () => {
		let daysBeforeReferenceDate: number;

		try {
			// We read the site's date at the moment the reference date starts
			// in the browser's time zone. While the site's time zone loads,
			// `timeZone` is `undefined`, and `Intl.DateTimeFormat` then uses the
			// browser's time zone.
			const { year, month, day } = Object.fromEntries(
				new Intl.DateTimeFormat( 'en-US', {
					timeZone: timezone,
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
				} )
					.formatToParts( stringToDate( referenceDate ) )
					.map( ( { type, value } ) => [ type, value ] )
			);
			const siteDate = `${ year }-${ month }-${ day }`;

			daysBeforeReferenceDate = siteDate < referenceDate ? 2 : 1;
		} catch {
			// `Intl.DateTimeFormat` throws for a time zone the browser doesn't
			// know, and for the empty string, which is the time zone of a site
			// that uses a UTC offset. In both cases, we can't tell whether the
			// site's time zone is behind the browser's time zone, because the
			// site info has no UTC offset.
			daysBeforeReferenceDate = 2;
		}

		return {
			startDate: getPreviousDate(
				referenceDate,
				daysBeforeReferenceDate
			),
			endDate: referenceDate,
		};
	}, [ referenceDate, timezone ] );
}

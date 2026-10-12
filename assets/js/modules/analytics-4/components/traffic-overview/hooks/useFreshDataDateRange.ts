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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getPreviousDate } from '@/js/util';

export interface FreshDataDateRange {
	/** The first day of the date range, e.g. `2025-02-03`. */
	startDate: string;
	/** The last day of the date range, which is the reference date, e.g. `2025-02-05`. */
	endDate: string;
}

/**
 * Gets the date range of the Recent activity tab.
 *
 * The date range runs from two days before the reference date to the reference
 * date, and stays the same when the user selects another date range for the
 * dashboard.
 *
 * The reference date is a date in the browser's time zone. Analytics reports
 * in the time zone of the Analytics property, and Search Console in Pacific
 * Time. The date range starts two days back to hold yesterday in both
 * reports.
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

	return useMemo(
		() => ( {
			startDate: getPreviousDate( referenceDate, 2 ),
			endDate: referenceDate,
		} ),
		[ referenceDate ]
	);
}

/**
 * PAX util functions.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { stringToDate } from '../../../util';
import { DATE_RANGE_OFFSET } from '../../analytics-4/datastore/constants';

/**
 * Returns formatted date object.
 *
 * @since n.e.x.t
 *
 * @param {string} dateString Date in 'YYYY-MM-DD' format.
 * @return {Date} Date instance.
 */
export function formatPaxDate( dateString ) {
	const dateObject = stringToDate( dateString );

	return {
		year: dateObject.getFullYear(),
		// PAX is expecting 1-index number, `stringToDate()` will convert it
		// to the 0-index so we need to revert it here.
		month: dateObject.getMonth() + 1,
		day: dateObject.getDate(),
	};
}

/**
 * Returns the current date range as a list of formatted date objects.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry Registry object to dispatch to.
 * @return {Date} Date instance.
 */
export function getPaxDateRange( registry ) {
	const { startDate, endDate } = registry
		.select( CORE_USER )
		.getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );

	return {
		startDate: formatPaxDate( startDate ),
		endDate: formatPaxDate( endDate ),
	};
}

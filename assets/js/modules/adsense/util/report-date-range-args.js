/**
 * Report date range args utils.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import { isValidDateString } from '../../../util';

/**
 * Generates an object with the appropriate structure to pass to report selectors.
 *
 * @since 1.27.0
 *
 * @param {Object} dates           Object containing the start and end dates.
 * @param {string} dates.startDate Start date in YYYY-MM-DD format.
 * @param {string} dates.endDate   End date in YYYY-MM-DD format.
 * @return {Object} Date range object.
 */
export const generateDateRangeArgs = ( dates ) => {
	invariant( dates, 'A dates object is required.' );
	const { startDate, endDate } = dates;
	invariant(
		isValidDateString( startDate ),
		'A valid startDate is required.'
	);
	invariant( isValidDateString( endDate ), 'A valid endDate is required.' );

	return {
		d: `${ startDate.replace( /-/g, '/' ) }-${ endDate.replace(
			/-/g,
			'/'
		) }`,
	};
};

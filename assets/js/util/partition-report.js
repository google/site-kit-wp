/**
 * Report partitioning utility.
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
 * Splits report data into segments for current and comparison ranges.
 *
 * @since 1.33.0
 * @since 1.34.0 Updated to support incomplete `report` arrays.
 *
 * @param {Array}  report               Report rows.
 * @param {Object} args                 Additional arguments.
 * @param {number} args.dateRangeLength Date range length of report segments.
 * @return {Object} Object with keys for `compareRange` and `currentRange`.
 */
export const partitionReport = ( report, { dateRangeLength } ) => {
	invariant( Array.isArray( report ), 'report must be an array to partition.' );
	invariant( Number.isInteger( dateRangeLength ) && dateRangeLength > 0, 'dateRangeLength must be a positive integer.' );

	// Use a negative date range length for reverse slicing.
	const _dateRangeLength = -1 * dateRangeLength;

	return {
		// The current range should always be sliced from the end.
		currentRange: report.slice( _dateRangeLength ),
		// The compare range continues from where the current left off (slicing towards the start),
		// and may be shorter (where older data is not available yet) which is fine.
		compareRange: report.slice( _dateRangeLength * 2, _dateRangeLength ),
	};
};

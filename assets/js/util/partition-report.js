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
 * Splits report data into segments of equal length for current and comparison ranges.
 *
 * @since 1.33.0
 *
 * @param {Array}  report               Report rows.
 * @param {Object} args                 Additional arguments.
 * @param {number} args.dateRangeLength Date range length of report segments.
 * @return {Object} Object with keys for `compareRange` and `currentRange`.
 */
export const partitionReport = ( report, { dateRangeLength } ) => {
	invariant( Array.isArray( report ), 'report must be an array to partition.' );
	invariant( Number.isInteger( dateRangeLength ) && dateRangeLength > 0, 'dateRangeLength must be a positive integer.' );

	const compareRange = report.slice( 0, dateRangeLength );
	const currentRange = report.slice( dateRangeLength, dateRangeLength * 2 );
	// The current range will always be shorter here if the two segments are not of equal length.

	return {
		compareRange: compareRange.slice( 0, currentRange.length ),
		currentRange,
	};
};

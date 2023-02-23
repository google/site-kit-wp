/**
 * Utility functions for zeroing Analytics report data.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * Returns a copy of the provided Analytics report with all metric values replaced with zero.
 *
 * @since 1.95.0
 *
 * @param {Array<Object>} report Array containing Analytics report object(s).
 * @return {Array<Object>} Array containing zeroed Analytics report object(s).
 */
export function replaceValuesInAnalyticsReportWithZeroData( report ) {
	const zeroValues = ( { values } ) => ( {
		values: values.map( () => 0 ),
	} );

	return report.map( ( single ) => ( {
		...single,
		data: {
			...single.data,
			totals: single.data.totals.map( zeroValues ),
			maximums: single.data.maximums.map( zeroValues ),
			minimums: single.data.minimums.map( zeroValues ),
			rows: single.data.rows.map( ( { dimensions, metrics } ) => ( {
				dimensions,
				metrics: metrics.map( zeroValues ),
			} ) ),
		},
	} ) );
}

/**
 * Returns a copy of the provided Analytics 4 report with all values removed,
 * matching the format of an empty report.
 *
 * @since 1.95.0
 *
 * @param {Object} report Analytics 4 report object.
 * @return {Object} Empty Analytics 4 report object.
 */
export function replaceValuesInAnalytics4ReportWithZeroData( report ) {
	// eslint-disable-next-line no-unused-vars -- Ignore `rows` and `rowCount` since we're omitting them from the returned report object.
	const { rows, rowCount, ...reportWithoutRows } = report;

	const toEmptyObject = () => ( {} );

	return {
		...reportWithoutRows,
		totals: report.totals?.map( toEmptyObject ),
		maximums: report.maximums?.map( toEmptyObject ),
		minimums: report.minimums?.map( toEmptyObject ),
	};
}

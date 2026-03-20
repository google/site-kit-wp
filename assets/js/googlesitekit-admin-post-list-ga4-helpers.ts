/**
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
 * Minimal GA4 report row shape from `get( 'modules', …, 'report', … )`.
 *
 * @since n.e.x.t
 */
export interface ReportRow {
	dimensionValues?: Array< { value?: string } >;
	metricValues?: Array< { value?: string } >;
}

/**
 * Report payload accepted by {@link parseRowsToPathMap}.
 *
 * @since n.e.x.t
 */
export interface ReportPayload {
	rows?: ReportRow[];
}

/**
 * Splits an array into chunks of at most `size` elements.
 *
 * @since n.e.x.t
 *
 * @param arr  Input array.
 * @param size Chunk size (positive integer).
 * @return Chunk arrays.
 */
export function chunkArray< T >( arr: T[], size: number ): T[][] {
	const out: T[][] = [];
	for ( let index = 0; index < arr.length; index += size ) {
		out.push( arr.slice( index, index + size ) );
	}
	return out;
}

/**
 * Maps GA4 report rows to path → first metric value.
 *
 * @since n.e.x.t
 *
 * @param report Report payload from `get()`.
 * @return Path keys to metric value strings.
 */
export function parseRowsToPathMap(
	report: ReportPayload | null | undefined
): Record< string, string > {
	const map: Record< string, string > = {};
	if ( ! report?.rows?.length ) {
		return map;
	}
	for ( const row of report.rows ) {
		const dimValue = row.dimensionValues?.[ 0 ]?.value;
		const metValue = row.metricValues?.[ 0 ]?.value;
		if (
			dimValue !== undefined &&
			dimValue !== null &&
			metValue !== undefined &&
			metValue !== null
		) {
			map[ dimValue ] = metValue;
		}
	}
	return map;
}

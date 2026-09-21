/**
 * Benchmarking response decoder.
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
 * Internal dependencies
 */
import { getDateString, isValidDateString, stringToDate } from '@/js/util';
import {
	BENCHMARKING_CONTEXTUAL_DATA_KEYS,
	BENCHMARKING_DIMENSION_CODES,
	BENCHMARKING_FORMAT_VERSION,
	MEMBER_DAILY_VISITORS,
	MEMBER_DIMENSION_ORDER,
	MEMBER_DIMENSION_ROWS,
	MEMBER_FIRST_DATE,
	MEMBER_STRINGS,
	MEMBER_VERSION,
	MEMBER_VISITOR_TOTALS,
} from './constants';
import {
	BenchmarkingContentRow,
	BenchmarkingContextualData,
	BenchmarkingDailyTrafficRow,
	BenchmarkingDimensionCode,
	BenchmarkingSearchQueryRow,
	BenchmarkingValueRow,
	DecodedBenchmarkingResponse,
} from './types';

const MEMBER_COUNT = 7;

/**
 * Reads a string field, which travels as its position in the string table.
 *
 * @since n.e.x.t
 *
 * @param {Array}       strings The response's string table.
 * @param {number|null} index   The string's position, or null when the row carried no string.
 * @return {string|null} The string, or null.
 */
function readString( strings: string[], index: unknown ): string | null {
	return typeof index === 'number' ? strings[ index ] ?? null : null;
}

/**
 * Builds one `dailyTraffic` row per daily count, dating each from the first
 * plotted day.
 *
 * @since n.e.x.t
 *
 * @param {*}     firstDate     The first plotted day, as `YYYY-MM-DD`. Read only when there are counts to date.
 * @param {Array} dailyVisitors One visitor count per day, from that day on.
 * @return {Array} The `dailyTraffic` rows, empty when the response carried no counts.
 */
function decodeDailyTraffic(
	firstDate: unknown,
	dailyVisitors: number[]
): BenchmarkingDailyTrafficRow[] {
	if ( ! dailyVisitors.length ) {
		return [];
	}

	// The date walks a day at a time rather than adding a day's worth of
	// seconds to the first day, which lands on the wrong date in a time zone
	// whose clocks change inside the plotted range.
	const date = stringToDate( firstDate );

	return dailyVisitors.map( ( visitors ) => {
		const row = { date: getDateString( date ), visitors };

		date.setDate( date.getDate() + 1 );

		return row;
	} );
}

/**
 * Decodes one dimension's rows into the shape its `contextualData` key holds.
 *
 * @since n.e.x.t
 *
 * @param {string} code    The dimension's code.
 * @param {Array}  rows    The dimension's encoded rows.
 * @param {Array}  strings The response's string table.
 * @return {Array} The decoded rows.
 */
function decodeDimensionRows(
	code: BenchmarkingDimensionCode,
	rows: unknown[][],
	strings: string[]
) {
	if ( code === 'CONTENT' ) {
		return rows.map(
			( [ url, title, visitors, publishedDaysAgo ] ) =>
				( {
					url: readString( strings, url ),
					title: readString( strings, title ),
					visitors,
					publishedDaysAgo,
				} as BenchmarkingContentRow )
		);
	}

	if ( code === 'SEARCH_QUERIES' ) {
		return rows.map(
			( [
				label,
				current,
				previous,
				positionCurrent,
				positionPrevious,
			] ) =>
				( {
					label: readString( strings, label ),
					current,
					previous,
					positionCurrent,
					positionPrevious,
				} as BenchmarkingSearchQueryRow )
		);
	}

	return rows.map(
		( [ label, current, previous ] ) =>
			( {
				label: readString( strings, label ),
				current,
				previous,
			} as BenchmarkingValueRow )
	);
}

/**
 * Decodes an encoded benchmarking response.
 *
 * @since n.e.x.t
 *
 * @param {*} encoded The encoded response.
 * @return {Object|null} The decoded response, or null when it cannot be read.
 */
export function decodeBenchmarkingResponse(
	encoded: unknown
): DecodedBenchmarkingResponse | null {
	if (
		! Array.isArray( encoded ) ||
		encoded.length !== MEMBER_COUNT ||
		encoded[ MEMBER_VERSION ] !== BENCHMARKING_FORMAT_VERSION
	) {
		return null;
	}

	const firstDate = encoded[ MEMBER_FIRST_DATE ];
	const dailyVisitors = encoded[ MEMBER_DAILY_VISITORS ];
	const visitorTotals = encoded[ MEMBER_VISITOR_TOTALS ];

	const membersHoldTheirShapes =
		Array.isArray( encoded[ MEMBER_STRINGS ] ) &&
		Array.isArray( dailyVisitors ) &&
		Array.isArray( encoded[ MEMBER_DIMENSION_ORDER ] ) &&
		// Both totals, or the headline figure reads as a missing number
		// rather than as an unusable response.
		Array.isArray( visitorTotals ) &&
		visitorTotals.length === 2 &&
		// The encoder writes no first date for an empty series, so a day to
		// count from is only needed once there are counts to date.
		( ! dailyVisitors.length || isValidDateString( firstDate ) );

	if ( ! membersHoldTheirShapes ) {
		return null;
	}

	const strings = encoded[ MEMBER_STRINGS ] as string[];
	const [ current, previous ] = visitorTotals as number[];
	const encodedRows = encoded[ MEMBER_DIMENSION_ROWS ] as Record<
		string,
		unknown[][]
	>;

	const dimensions: BenchmarkingDimensionCode[] = [];
	const contextualData: BenchmarkingContextualData = {};

	( encoded[ MEMBER_DIMENSION_ORDER ] as number[] ).forEach( ( index ) => {
		const code = BENCHMARKING_DIMENSION_CODES[ index ];

		if ( ! code ) {
			return;
		}

		const rows = encodedRows?.[ index ];

		dimensions.push( code );
		contextualData[ BENCHMARKING_CONTEXTUAL_DATA_KEYS[ code ] ] =
			decodeDimensionRows(
				code,
				Array.isArray( rows ) ? rows : [],
				strings
			) as never;
	} );

	return {
		visitors: { current, previous },
		dailyTraffic: decodeDailyTraffic( firstDate, dailyVisitors ),
		dimensions,
		contextualData,
	};
}

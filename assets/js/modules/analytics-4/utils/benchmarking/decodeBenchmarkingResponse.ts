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
import {
	addDays,
	getDateString,
	isValidDateString,
	stringToDate,
} from '@/js/util';
import {
	BENCHMARKING_FORMAT_VERSION,
	BENCHMARKING_KEY_FACTOR_ATTRIBUTE_KINDS,
	BENCHMARKING_KEY_FACTOR_KINDS,
	MEMBER_DAILY_EXPECTED_RANGES,
	MEMBER_DAILY_VISITS,
	MEMBER_FIRST_DATE,
	MEMBER_FIRST_TRAFFIC_DAY_OFFSET,
	MEMBER_KEY_FACTORS,
	MEMBER_KEY_FACTOR_ATTRIBUTES,
	MEMBER_STRINGS,
	MEMBER_VERSION,
	MEMBER_VISIT_TOTALS,
} from './constants';
import {
	BenchmarkingDailyTrafficRow,
	BenchmarkingKeyFactor,
	BenchmarkingKeyFactorAttribute,
	DecodedBenchmarkingResponse,
} from './types';

const MEMBER_COUNT = 9;

/** A day's expected range, as `[ expectedMin, expectedMax ]`, or null on a day without one. */
type EncodedExpectedRange = [ number, number ] | null;

/**
 * Reads a string field, which travels as its position in the string table.
 *
 * @since 1.189.0
 *
 * @param {Array}       strings The response's string table.
 * @param {number|null} index   The string's position, or null when the row carried no string.
 * @return {string|null} The string, or null.
 */
function readString( strings: string[], index: unknown ): string | null {
	return typeof index === 'number' ? strings[ index ] ?? null : null;
}

/**
 * Checks whether a value is a day's expected range: null, or a list of two
 * numbers.
 *
 * @since n.e.x.t
 *
 * @param {*} value The value to check.
 * @return {boolean} True when the value is null or a list of two numbers, false otherwise.
 */
function isExpectedRange( value: unknown ): value is EncodedExpectedRange {
	return (
		value === null ||
		( Array.isArray( value ) &&
			value.length === 2 &&
			value.every( ( bound ) => typeof bound === 'number' ) )
	);
}

/**
 * Builds one `dailyTraffic` row per daily count, dating each from the first
 * plotted day.
 *
 * @since 1.189.0
 * @since 1.191.0 Gives each row its count as `visits` in place of `visitors`.
 * @since n.e.x.t Added the `expectedRanges` parameter, and gives each row `expectedMin` and `expectedMax`.
 *
 * @param {*}     firstDate      The first plotted day, as `YYYY-MM-DD`. Read only when there are counts to date.
 * @param {Array} dailyVisits    One visit count per day, from that day on.
 * @param {Array} expectedRanges One expected range per daily count, in the same order, each null or as `[ expectedMin, expectedMax ]`.
 * @return {Array} The `dailyTraffic` rows, empty when the response carried no counts.
 */
function decodeDailyTraffic(
	firstDate: unknown,
	dailyVisits: number[],
	expectedRanges: EncodedExpectedRange[]
): BenchmarkingDailyTrafficRow[] {
	if ( ! dailyVisits.length ) {
		return [];
	}

	// The date walks a day at a time rather than adding a day's worth of
	// seconds to the first day, which lands on the wrong date in a time zone
	// whose clocks change inside the plotted range.
	const date = stringToDate( firstDate );

	return dailyVisits.map( ( visits, position ) => {
		const [ expectedMin, expectedMax ] = expectedRanges[ position ] ?? [
			null,
			null,
		];
		const row = {
			date: getDateString( date ),
			visits,
			expectedMin,
			expectedMax,
		};

		date.setDate( date.getDate() + 1 );

		return row;
	} );
}

/**
 * Decodes the first day with recorded traffic, which travels as its offset in
 * days from the first plotted day.
 *
 * @since n.e.x.t
 *
 * @param {string}      firstDate The first plotted day, as `YYYY-MM-DD`.
 * @param {number|null} dayOffset The number of days from the first plotted day, negative for an earlier day, or null when the site has no recorded traffic.
 * @return {string|null} The day, as `YYYY-MM-DD`, or null.
 */
function decodeFirstTrafficDate(
	firstDate: string,
	dayOffset: number | null
): string | null {
	// The day is counted on the calendar, so a clock change between the two
	// days moves neither of them.
	return dayOffset === null ? null : addDays( firstDate, dayOffset );
}

/**
 * Decodes a key factor card or one of its attributes, which travel in the same
 * layout.
 *
 * @since 1.191.0
 *
 * @param {*}     row     The encoded card or attribute.
 * @param {Array} kinds   The kinds in the order they travel as, from `BENCHMARKING_KEY_FACTOR_KINDS` or `BENCHMARKING_KEY_FACTOR_ATTRIBUTE_KINDS`.
 * @param {Array} strings The response's string table.
 * @return {Object|null} The decoded card or attribute, or null when it is not a list, is shorter than its layout, or its kind is not in `kinds`.
 */
function decodeKeyFactorRow< Kind extends string >(
	row: unknown,
	kinds: readonly Kind[],
	strings: string[]
): ( Omit< BenchmarkingKeyFactorAttribute, 'kind' > & { kind: Kind } ) | null {
	// A row shorter than its layout, or not a list at all, is left out rather
	// than destructured: destructuring a value that is not iterable throws.
	if ( ! Array.isArray( row ) || row.length < 5 ) {
		return null;
	}

	const [ kindIndex, label, current, previous, sharePct ] = row;
	// Only a whole number is a position in `kinds`. A name such as `length`
	// would read a property of the array instead.
	const kind = Number.isInteger( kindIndex ) ? kinds[ kindIndex ] : undefined;

	if ( ! kind ) {
		return null;
	}

	return {
		kind,
		label: readString( strings, label ),
		current,
		previous,
		sharePct,
	};
}

/**
 * Decodes the key factor cards, each with the attributes at its own position.
 *
 * @since 1.191.0
 *
 * @param {Array} cards      The encoded cards, in rank order.
 * @param {Array} attributes One list of encoded attributes per card, in the same order.
 * @param {Array} strings    The response's string table.
 * @return {Array} The decoded cards, without the cards and attributes that cannot be read.
 */
function decodeKeyFactors(
	cards: unknown[],
	attributes: unknown[],
	strings: string[]
): BenchmarkingKeyFactor[] {
	return cards.flatMap( ( card, position ) => {
		const keyFactor = decodeKeyFactorRow(
			card,
			BENCHMARKING_KEY_FACTOR_KINDS,
			strings
		);

		if ( ! keyFactor ) {
			return [];
		}

		const cardAttributes = attributes[ position ];
		const attributeRows = Array.isArray( cardAttributes )
			? cardAttributes
			: [];

		return {
			...keyFactor,
			attributes: attributeRows.flatMap(
				( attribute ) =>
					decodeKeyFactorRow(
						attribute,
						BENCHMARKING_KEY_FACTOR_ATTRIBUTE_KINDS,
						strings
					) ?? []
			),
		};
	} );
}

/**
 * Checks whether the members that describe each day hold their shapes: the
 * daily counts, the expected range of each day, and the first day with
 * recorded traffic, which travels as its offset from the first plotted day.
 *
 * @since n.e.x.t
 *
 * @param {Array} encoded The encoded response, with every member.
 * @return {boolean} True when the members can be read, false otherwise.
 */
function dailyMembersHoldTheirShapes( encoded: unknown[] ): boolean {
	const firstDate = encoded[ MEMBER_FIRST_DATE ];
	const dailyVisits = encoded[ MEMBER_DAILY_VISITS ];
	const expectedRanges = encoded[ MEMBER_DAILY_EXPECTED_RANGES ];
	const firstTrafficDayOffset = encoded[ MEMBER_FIRST_TRAFFIC_DAY_OFFSET ];

	if ( ! Array.isArray( dailyVisits ) || ! Array.isArray( expectedRanges ) ) {
		return false;
	}

	// The encoder writes no first date for an empty series, so a day to count
	// from is only needed once there are counts to date or a first traffic day
	// to count to.
	const countsFromTheFirstDate =
		dailyVisits.length > 0 || firstTrafficDayOffset !== null;

	return (
		( ! countsFromTheFirstDate || isValidDateString( firstDate ) ) &&
		// Each day reads its expected range from its own position, so a list
		// of a different length gives a day another day's range.
		expectedRanges.length === dailyVisits.length &&
		expectedRanges.every( isExpectedRange ) &&
		( firstTrafficDayOffset === null ||
			Number.isInteger( firstTrafficDayOffset ) )
	);
}

/**
 * Decodes an encoded benchmarking response.
 *
 * @since 1.189.0
 * @since 1.191.0 Decodes the key factor cards in place of the dimension rows, and returns `visits` in place of `visitors`.
 * @since n.e.x.t Decodes the expected range of each day and the first day with recorded traffic.
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
	const dailyVisits = encoded[ MEMBER_DAILY_VISITS ];
	const visitTotals = encoded[ MEMBER_VISIT_TOTALS ];
	const encodedKeyFactors = encoded[ MEMBER_KEY_FACTORS ];
	const encodedKeyFactorAttributes = encoded[ MEMBER_KEY_FACTOR_ATTRIBUTES ];
	const expectedRanges = encoded[ MEMBER_DAILY_EXPECTED_RANGES ];
	const firstTrafficDayOffset = encoded[ MEMBER_FIRST_TRAFFIC_DAY_OFFSET ];

	const membersHoldTheirShapes =
		Array.isArray( encoded[ MEMBER_STRINGS ] ) &&
		// Each card reads its attributes from the same position, so a list of
		// a different length pairs a card with another card's attributes.
		Array.isArray( encodedKeyFactors ) &&
		Array.isArray( encodedKeyFactorAttributes ) &&
		encodedKeyFactors.length === encodedKeyFactorAttributes.length &&
		// Both totals, or the headline figure reads as a missing number
		// rather than as an unusable response.
		Array.isArray( visitTotals ) &&
		visitTotals.length === 2 &&
		dailyMembersHoldTheirShapes( encoded );

	if ( ! membersHoldTheirShapes ) {
		return null;
	}

	const strings = encoded[ MEMBER_STRINGS ] as string[];
	const [ current, previous ] = visitTotals as number[];

	return {
		visits: { current, previous },
		dailyTraffic: decodeDailyTraffic(
			firstDate,
			dailyVisits,
			expectedRanges
		),
		firstTrafficDate: decodeFirstTrafficDate(
			firstDate,
			firstTrafficDayOffset
		),
		keyFactors: decodeKeyFactors(
			encodedKeyFactors,
			encodedKeyFactorAttributes,
			strings
		),
	};
}

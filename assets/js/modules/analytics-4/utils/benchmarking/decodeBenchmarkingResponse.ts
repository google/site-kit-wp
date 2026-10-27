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
	BENCHMARKING_FORMAT_VERSION,
	BENCHMARKING_KEY_FACTOR_ATTRIBUTE_KINDS,
	BENCHMARKING_KEY_FACTOR_KINDS,
	MEMBER_DAILY_VISITS,
	MEMBER_FIRST_DATE,
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

const MEMBER_COUNT = 7;

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
 * Builds one `dailyTraffic` row per daily count, dating each from the first
 * plotted day.
 *
 * @since 1.189.0
 * @since n.e.x.t Gives each row its count as `visits` in place of `visitors`.
 *
 * @param {*}     firstDate   The first plotted day, as `YYYY-MM-DD`. Read only when there are counts to date.
 * @param {Array} dailyVisits One visit count per day, from that day on.
 * @return {Array} The `dailyTraffic` rows, empty when the response carried no counts.
 */
function decodeDailyTraffic(
	firstDate: unknown,
	dailyVisits: number[]
): BenchmarkingDailyTrafficRow[] {
	if ( ! dailyVisits.length ) {
		return [];
	}

	// The date walks a day at a time rather than adding a day's worth of
	// seconds to the first day, which lands on the wrong date in a time zone
	// whose clocks change inside the plotted range.
	const date = stringToDate( firstDate );

	return dailyVisits.map( ( visits ) => {
		const row = { date: getDateString( date ), visits };

		date.setDate( date.getDate() + 1 );

		return row;
	} );
}

/**
 * Decodes a key factor card or one of its attributes, which travel in the same
 * layout.
 *
 * @since n.e.x.t
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
 * @since n.e.x.t
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
 * Decodes an encoded benchmarking response.
 *
 * @since 1.189.0
 * @since n.e.x.t Decodes the key factor cards in place of the dimension rows, and returns `visits` in place of `visitors`.
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

	const membersHoldTheirShapes =
		Array.isArray( encoded[ MEMBER_STRINGS ] ) &&
		Array.isArray( dailyVisits ) &&
		// Each card reads its attributes from the same position, so a list of
		// a different length pairs a card with another card's attributes.
		Array.isArray( encodedKeyFactors ) &&
		Array.isArray( encodedKeyFactorAttributes ) &&
		encodedKeyFactors.length === encodedKeyFactorAttributes.length &&
		// Both totals, or the headline figure reads as a missing number
		// rather than as an unusable response.
		Array.isArray( visitTotals ) &&
		visitTotals.length === 2 &&
		// The encoder writes no first date for an empty series, so a day to
		// count from is only needed once there are counts to date.
		( ! dailyVisits.length || isValidDateString( firstDate ) );

	if ( ! membersHoldTheirShapes ) {
		return null;
	}

	const strings = encoded[ MEMBER_STRINGS ] as string[];
	const [ current, previous ] = visitTotals as number[];

	return {
		visits: { current, previous },
		dailyTraffic: decodeDailyTraffic( firstDate, dailyVisits ),
		keyFactors: decodeKeyFactors(
			encodedKeyFactors,
			encodedKeyFactorAttributes,
			strings
		),
	};
}

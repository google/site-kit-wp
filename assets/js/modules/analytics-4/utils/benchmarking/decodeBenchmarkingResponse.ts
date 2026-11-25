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
	AVAILABILITY_BAND_AVAILABLE,
	AVAILABILITY_BAND_AVAILABLE_FROM,
	AVAILABILITY_FIELD_COUNT,
	AVAILABILITY_INSIGHT_REQUEST_ALLOWED,
	AVAILABILITY_KEY_FACTORS_AVAILABLE,
	AVAILABILITY_KEY_FACTORS_AVAILABLE_FROM,
	AVAILABILITY_LAST_YEAR_AVAILABLE,
	AVAILABILITY_LOW_TRAFFIC,
	AVAILABILITY_PERFORMANCE_INSIGHT_AVAILABLE,
	AVAILABILITY_RANGE_TOO_LONG,
	AVAILABILITY_RANGE_TOO_SHORT,
	BENCHMARKING_FORMAT_VERSION,
	BENCHMARKING_KEY_FACTOR_ATTRIBUTE_KINDS,
	BENCHMARKING_KEY_FACTOR_KINDS,
	BENCHMARKING_KEY_FACTOR_SHARE_BASES,
	KEY_FACTOR_ATTRIBUTE_OVERSIZED,
	KEY_FACTOR_CARD_PARENT_CHANNEL,
	KEY_FACTOR_CARD_PARENT_CHANNEL_CHANGE,
	KEY_FACTOR_CARD_SHARE_BASIS,
	KEY_FACTOR_CARD_SPREAD_ACROSS_PAGES,
	KEY_FACTOR_CARD_URL,
	MEMBER_AVAILABILITY,
	MEMBER_BAND_REFERENCE_DAYS,
	MEMBER_CONTENT_MARKERS,
	MEMBER_DAILY_EXPECTED_RANGES,
	MEMBER_DAILY_VISITS,
	MEMBER_FIRST_DATE,
	MEMBER_INSIGHT_LOCALE,
	MEMBER_INSIGHT_PAYLOAD,
	MEMBER_KEY_FACTORS,
	MEMBER_KEY_FACTOR_ATTRIBUTES,
	MEMBER_STEADY_TRAFFIC,
	MEMBER_STRINGS,
	MEMBER_VERSION,
	MEMBER_VISIT_TOTALS,
} from './constants';
import {
	BenchmarkingAvailability,
	BenchmarkingContentMarker,
	BenchmarkingContentMarkerPost,
	BenchmarkingDailyTrafficRow,
	BenchmarkingKeyFactor,
	BenchmarkingKeyFactorAttribute,
	BenchmarkingKeyFactorParentChannel,
	DecodedBenchmarkingResponse,
} from './types';

/** The members of a response built without the `trafficInsights` feature. */
const MEMBER_COUNT = 12;

/** The members of a response built with the `trafficInsights` feature, which adds the insight's locale and request. */
const MEMBER_COUNT_WITH_INSIGHT = 14;

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
 * Decodes a day that travels as its offset in days from the first plotted day.
 *
 * @since n.e.x.t
 *
 * @param {string}      firstDate The first plotted day, as `YYYY-MM-DD`.
 * @param {number|null} dayOffset The number of days from the first plotted day, negative for an earlier day, or null when there is no day.
 * @return {string|null} The day, as `YYYY-MM-DD`, or null.
 */
function decodeDayOffset(
	firstDate: string,
	dayOffset: number | null
): string | null {
	// The day is counted on the calendar, so a clock change between the two
	// days moves neither of them.
	return dayOffset === null ? null : addDays( firstDate, dayOffset );
}

/**
 * Checks whether a value is the availability member: a list of its flags and
 * its days, each day an offset from the first plotted day or null.
 *
 * @since n.e.x.t
 *
 * @param {*} value The value to check.
 * @return {boolean} True when the value is a list with a boolean or a day at each position, false otherwise.
 */
function isAvailability( value: unknown ): value is unknown[] {
	const dayPositions: unknown[] = [
		AVAILABILITY_BAND_AVAILABLE_FROM,
		AVAILABILITY_KEY_FACTORS_AVAILABLE_FROM,
	];

	return (
		Array.isArray( value ) &&
		value.length === AVAILABILITY_FIELD_COUNT &&
		value.every( ( field, position ) =>
			dayPositions.includes( position )
				? field === null || Number.isInteger( field )
				: typeof field === 'boolean'
		)
	);
}

/**
 * Decodes which parts of the typical traffic view the date range has.
 *
 * @since n.e.x.t
 *
 * @param {string} firstDate    The first plotted day, as `YYYY-MM-DD`.
 * @param {Array}  availability The encoded availability, as `isAvailability()` checks it.
 * @return {Object} The decoded availability.
 */
function decodeAvailability(
	firstDate: string,
	availability: unknown[]
): BenchmarkingAvailability {
	return {
		rangeTooShort: availability[ AVAILABILITY_RANGE_TOO_SHORT ] as boolean,
		bandAvailable: availability[ AVAILABILITY_BAND_AVAILABLE ] as boolean,
		bandAvailableFrom: decodeDayOffset(
			firstDate,
			availability[ AVAILABILITY_BAND_AVAILABLE_FROM ] as number | null
		),
		keyFactorsAvailable: availability[
			AVAILABILITY_KEY_FACTORS_AVAILABLE
		] as boolean,
		keyFactorsAvailableFrom: decodeDayOffset(
			firstDate,
			availability[ AVAILABILITY_KEY_FACTORS_AVAILABLE_FROM ] as
				| number
				| null
		),
		insightRequestAllowed: availability[
			AVAILABILITY_INSIGHT_REQUEST_ALLOWED
		] as boolean,
		performanceInsightAvailable: availability[
			AVAILABILITY_PERFORMANCE_INSIGHT_AVAILABLE
		] as boolean,
		lastYearAvailable: availability[
			AVAILABILITY_LAST_YEAR_AVAILABLE
		] as boolean,
		rangeTooLong: availability[ AVAILABILITY_RANGE_TOO_LONG ] as boolean,
		lowTraffic: availability[ AVAILABILITY_LOW_TRAFFIC ] as boolean,
	};
}

/**
 * Reads a value that travels as its position in a list, such as a kind.
 *
 * @since n.e.x.t
 *
 * @param {*}     index  The value's position.
 * @param {Array} values The values in the order they travel as.
 * @return {string|undefined} The value, or `undefined` when the position is not a whole number in the list.
 */
function readListed< Value extends string >(
	index: unknown,
	values: readonly Value[]
): Value | undefined {
	// Only a whole number is a position in `values`. A name such as `length`
	// would read a property of the array instead.
	return Number.isInteger( index ) ? values[ index as number ] : undefined;
}

/**
 * Decodes the fields a key factor card and its attributes share, which travel
 * first, in the same layout.
 *
 * @since 1.191.0
 * @since n.e.x.t Decodes the shared fields alone, and reads the kind through `readListed()`.
 *
 * @param {*}     row     The encoded card or attribute.
 * @param {Array} kinds   The kinds in the order they travel as, from `BENCHMARKING_KEY_FACTOR_KINDS` or `BENCHMARKING_KEY_FACTOR_ATTRIBUTE_KINDS`.
 * @param {Array} strings The response's string table.
 * @return {Object|null} The decoded fields, or null when the row is not a list, is shorter than its layout, or its kind is not in `kinds`.
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
	const kind = readListed( kindIndex, kinds );

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
 * Decodes the channel a card on `PARENT_CHANNEL` took the place of: its name,
 * through the string table, and its change.
 *
 * @since n.e.x.t
 *
 * @param {Array} card    The encoded card.
 * @param {Array} strings The response's string table.
 * @return {Object|null} The channel, with `label` and `change`, or null when either cannot be read.
 */
function decodeParentChannel(
	card: unknown[],
	strings: string[]
): BenchmarkingKeyFactorParentChannel | null {
	const label = readString( strings, card[ KEY_FACTOR_CARD_PARENT_CHANNEL ] );
	const change = card[ KEY_FACTOR_CARD_PARENT_CHANNEL_CHANGE ];

	return label !== null && Number.isInteger( change )
		? { label, change: change as number }
		: null;
}

/**
 * Decodes an attribute of a key factor card.
 *
 * @since n.e.x.t
 *
 * @param {*}     attribute The encoded attribute.
 * @param {Array} strings   The response's string table.
 * @return {Object|null} The decoded attribute, with `oversized` only when it moved further than its card, or null when it cannot be read.
 */
function decodeKeyFactorAttribute(
	attribute: unknown,
	strings: string[]
): BenchmarkingKeyFactorAttribute | null {
	const decoded = decodeKeyFactorRow(
		attribute,
		BENCHMARKING_KEY_FACTOR_ATTRIBUTE_KINDS,
		strings
	);

	if ( ! decoded ) {
		return null;
	}

	// Only `true` marks an oversized attribute, so a field that cannot be read
	// shows the attribute with its share, as an attribute without one.
	return ( attribute as unknown[] )[ KEY_FACTOR_ATTRIBUTE_OVERSIZED ] === true
		? { ...decoded, oversized: true }
		: decoded;
}

/**
 * Decodes the key factor cards, each with the attributes at its own position.
 *
 * A card's fields after its share, and an attribute's, are only as many as
 * the encoder wrote, so a field that is missing or cannot be read is left out
 * of the decoded card, rather than making the card unusable.
 *
 * @since 1.191.0
 * @since n.e.x.t Reads the path of a post's card.
 * @since n.e.x.t Reads the basis of a card's share, the channel a card on `PARENT_CHANNEL` took the place of, and whether an attribute moved further than its card.
 * @since n.e.x.t Reads whether a card's change was spread across many pages.
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

		// `decodeKeyFactorRow` returns a card only for a list.
		const row = card as unknown[];
		// A post's card carries its path after its share.
		const url =
			keyFactor.kind === 'CONTENT'
				? readString( strings, row[ KEY_FACTOR_CARD_URL ] )
				: null;
		const shareBasis = readListed(
			row[ KEY_FACTOR_CARD_SHARE_BASIS ],
			BENCHMARKING_KEY_FACTOR_SHARE_BASES
		);
		// Only a share of a channel's change names the channel.
		const parentChannel =
			shareBasis === 'PARENT_CHANNEL'
				? decodeParentChannel( row, strings )
				: null;
		// Only `true` marks a change spread across many pages, so a field
		// that cannot be read leaves the card as one without the mark.
		const spreadAcrossPages =
			row[ KEY_FACTOR_CARD_SPREAD_ACROSS_PAGES ] === true;

		return {
			...keyFactor,
			...( url ? { url } : {} ),
			...( shareBasis ? { shareBasis } : {} ),
			...( parentChannel ? { parentChannel } : {} ),
			...( spreadAcrossPages ? { spreadAcrossPages } : {} ),
			attributes: attributeRows.flatMap(
				( attribute ) =>
					decodeKeyFactorAttribute( attribute, strings ) ?? []
			),
		};
	} );
}

/**
 * Decodes a post of a content marker, which travels as the positions of its
 * title and its path in the string table.
 *
 * @since n.e.x.t
 *
 * @param {*}     post    The encoded post.
 * @param {Array} strings The response's string table.
 * @return {Object|null} The decoded post, or null when it is not a list of two positions in the string table.
 */
function decodeContentMarkerPost(
	post: unknown,
	strings: string[]
): BenchmarkingContentMarkerPost | null {
	if ( ! Array.isArray( post ) || post.length !== 2 ) {
		return null;
	}

	const title = readString( strings, post[ 0 ] );
	const url = readString( strings, post[ 1 ] );

	return title !== null && url !== null ? { title, url } : null;
}

/**
 * Decodes the content markers, each of which travels as its day's offset from
 * the first plotted day, followed by its posts.
 *
 * The markers only label the chart, so a marker or a post that cannot be read
 * is left out rather than making the whole response unusable. So is a marker
 * whose posts are all left out, since a dot with nothing to name has nothing to
 * show.
 *
 * @since n.e.x.t
 *
 * @param {string} firstDate The first plotted day, as `YYYY-MM-DD`.
 * @param {Array}  markers   The encoded markers, oldest first, each as `[ dayOffset, [ title, url ], … ]`.
 * @param {Array}  strings   The response's string table.
 * @return {Array} The decoded markers.
 */
function decodeContentMarkers(
	firstDate: string,
	markers: unknown[],
	strings: string[]
): BenchmarkingContentMarker[] {
	if ( ! isValidDateString( firstDate ) ) {
		return [];
	}

	return markers.flatMap( ( marker ) => {
		if ( ! Array.isArray( marker ) || ! Number.isInteger( marker[ 0 ] ) ) {
			return [];
		}

		const [ dayOffset, ...encodedPosts ] = marker;
		const posts = encodedPosts.flatMap(
			( post ) => decodeContentMarkerPost( post, strings ) ?? []
		);

		if ( ! posts.length ) {
			return [];
		}

		// The day is counted on the calendar, so a clock change between the
		// two days moves neither of them.
		return { date: addDays( firstDate, dayOffset ), posts };
	} );
}

/**
 * Checks whether the members that describe each day hold their shapes: the
 * daily counts, the expected range of each day, and the availability, whose
 * days travel as their offsets from the first plotted day.
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
	const availability = encoded[ MEMBER_AVAILABILITY ];

	if (
		! Array.isArray( dailyVisits ) ||
		! Array.isArray( expectedRanges ) ||
		! isAvailability( availability )
	) {
		return false;
	}

	// The encoder writes no first date for an empty series, so a day to count
	// from is only needed once there are counts to date or an availability
	// day to count to.
	const countsFromTheFirstDate =
		dailyVisits.length > 0 ||
		availability[ AVAILABILITY_BAND_AVAILABLE_FROM ] !== null ||
		availability[ AVAILABILITY_KEY_FACTORS_AVAILABLE_FROM ] !== null;

	return (
		( ! countsFromTheFirstDate || isValidDateString( firstDate ) ) &&
		// Each day reads its expected range from its own position, so a list
		// of a different length gives a day another day's range.
		expectedRanges.length === dailyVisits.length &&
		expectedRanges.every( isExpectedRange )
	);
}

/**
 * Reads a string member that travels as itself.
 *
 * @since n.e.x.t
 *
 * @param {*} value The member's value.
 * @return {string|null} The string, or null when the value is not a non-empty string.
 */
function readOptionalString( value: unknown ): string | null {
	return typeof value === 'string' && value !== '' ? value : null;
}

/**
 * Reads the number of days of traffic the band is fitted on.
 *
 * @since n.e.x.t
 *
 * @param {*} value The member's value.
 * @return {number|null} The number of days, or null when the value is not a whole number above `0`.
 */
function readBandReferenceDays( value: unknown ): number | null {
	return Number.isInteger( value ) && ( value as number ) > 0
		? ( value as number )
		: null;
}

/**
 * Decodes an encoded benchmarking response.
 *
 * A response of the `trafficInsights` feature has two more members, the
 * insight's locale and request. A response with any other number of members
 * cannot be read.
 *
 * @since 1.189.0
 * @since 1.191.0 Decodes the key factor cards in place of the dimension rows, and returns `visits` in place of `visitors`.
 * @since n.e.x.t Decodes the expected range of each day and which parts of the typical traffic view the date range has.
 * @since n.e.x.t Decodes the locale and the request of the generated insight of a response that has them.
 * @since n.e.x.t Decodes the content markers.
 * @since n.e.x.t Decodes whether traffic was steady.
 * @since n.e.x.t Decodes the number of days of traffic the band is fitted on.
 * @since n.e.x.t Decodes the basis of each card's share, the channel a card on `PARENT_CHANNEL` took the place of, and whether an attribute moved further than its card.
 *
 * @param {*} encoded The encoded response.
 * @return {Object|null} The decoded response, or null when it cannot be read.
 */
export function decodeBenchmarkingResponse(
	encoded: unknown
): DecodedBenchmarkingResponse | null {
	if (
		! Array.isArray( encoded ) ||
		( encoded.length !== MEMBER_COUNT &&
			encoded.length !== MEMBER_COUNT_WITH_INSIGHT ) ||
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
	const encodedAvailability = encoded[ MEMBER_AVAILABILITY ];
	const encodedContentMarkers = encoded[ MEMBER_CONTENT_MARKERS ];

	const membersHoldTheirShapes =
		Array.isArray( encoded[ MEMBER_STRINGS ] ) &&
		Array.isArray( encodedContentMarkers ) &&
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

	const decodedResponse: DecodedBenchmarkingResponse = {
		visits: { current, previous },
		dailyTraffic: decodeDailyTraffic(
			firstDate,
			dailyVisits,
			expectedRanges
		),
		availability: decodeAvailability( firstDate, encodedAvailability ),
		// The number only names the band's history in its tooltip, so a
		// member that cannot be read leaves the band without a tooltip rather
		// than making the whole response unusable.
		bandReferenceDays: readBandReferenceDays(
			encoded[ MEMBER_BAND_REFERENCE_DAYS ]
		),
		keyFactors: decodeKeyFactors(
			encodedKeyFactors,
			encodedKeyFactorAttributes,
			strings
		),
		// Only `true` marks a steady period, so a member that cannot be read
		// shows the cards as the drivers of a change, as they were sent.
		steadyTraffic: encoded[ MEMBER_STEADY_TRAFFIC ] === true,
		contentMarkers: decodeContentMarkers(
			firstDate,
			encodedContentMarkers,
			strings
		),
	};

	// The figures never depend on the insight, so an insight member that
	// cannot be read means no insight rather than an unusable response.
	if ( encoded.length === MEMBER_COUNT_WITH_INSIGHT ) {
		decodedResponse.insightLocale = readOptionalString(
			encoded[ MEMBER_INSIGHT_LOCALE ]
		);
		decodedResponse.insightPayload = readOptionalString(
			encoded[ MEMBER_INSIGHT_PAYLOAD ]
		);
	}

	return decodedResponse;
}

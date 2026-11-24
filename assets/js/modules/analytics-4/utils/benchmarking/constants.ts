/**
 * Benchmarking response format constants.
 *
 * The PHP half of this file is
 * `includes/Modules/Analytics_4/Benchmarking/Wire_Format.php`, and the two must
 * agree: a number here is a position in the response the plugin encodes.
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
 * The layout the decoder reads. A response encoded in another version cannot
 * be decoded.
 */
export const BENCHMARKING_FORMAT_VERSION = 1;

/**
 * Envelope members, by position.
 */
export const MEMBER_VERSION = 0;
export const MEMBER_STRINGS = 1;
export const MEMBER_FIRST_DATE = 2;
export const MEMBER_DAILY_VISITS = 3;
export const MEMBER_VISIT_TOTALS = 4;
export const MEMBER_KEY_FACTORS = 5;
export const MEMBER_KEY_FACTOR_ATTRIBUTES = 6;
export const MEMBER_DAILY_EXPECTED_RANGES = 7;
export const MEMBER_AVAILABILITY = 8;
export const MEMBER_CONTENT_MARKERS = 9;
export const MEMBER_STEADY_TRAFFIC = 10;
export const MEMBER_BAND_REFERENCE_DAYS = 11;

/**
 * The members only a response of the `trafficInsights` feature carries: the
 * locale the generated insight is written in, and the signed request it is
 * written from, which the browser sends back unread.
 */
export const MEMBER_INSIGHT_LOCALE = 12;
export const MEMBER_INSIGHT_PAYLOAD = 13;

/**
 * The fields of the availability member, by position. Each `*_FROM` field is a
 * day, which travels as its offset from the first plotted day.
 */
export const AVAILABILITY_RANGE_TOO_SHORT = 0;
export const AVAILABILITY_BAND_AVAILABLE = 1;
export const AVAILABILITY_BAND_AVAILABLE_FROM = 2;
export const AVAILABILITY_KEY_FACTORS_AVAILABLE = 3;
export const AVAILABILITY_KEY_FACTORS_AVAILABLE_FROM = 4;
export const AVAILABILITY_INSIGHT_REQUEST_ALLOWED = 5;
export const AVAILABILITY_PERFORMANCE_INSIGHT_AVAILABLE = 6;
export const AVAILABILITY_LAST_YEAR_AVAILABLE = 7;

/** The number of fields of the availability member. */
export const AVAILABILITY_FIELD_COUNT = 8;

/**
 * The driver kinds of a key factor card, in the order they travel as. A kind's
 * position in this list is the index the encoded response carries. A kind is
 * only ever added at the end, so a position never changes meaning.
 */
export const BENCHMARKING_KEY_FACTOR_KINDS = [
	'CHANNEL',
	'CONTENT',
	'SEARCH_KEYWORD',
	'REFERRING_SITE',
	'CAMPAIGN',
	'CHANNEL_GROUP',
] as const;

/**
 * The kinds of a key factor card's attribute, in the order they travel as. A
 * kind's position in this list is the index the encoded response carries. A
 * kind is only ever added at the end, so a position never changes meaning.
 */
export const BENCHMARKING_KEY_FACTOR_ATTRIBUTE_KINDS = [
	'TRAFFIC_CHANNEL',
	'LANDING_PAGE',
	'SEARCH_KEYWORD',
	'REFERRING_SITE',
	'PLATFORM',
	'CAMPAIGN',
	'DEVICE',
	'USER_TYPE',
	'ASSISTANT',
] as const;

/**
 * The bases of a key factor card's share, what the share is of, in the order
 * they travel as. A basis's position in this list is the index the encoded
 * response carries. A basis is only ever added at the end, so a position never
 * changes meaning.
 */
export const BENCHMARKING_KEY_FACTOR_SHARE_BASES = [
	'GROSS_CHANGE',
	'NET_CHANGE',
	'SITE_TRAFFIC',
	'VOLUME',
	'PARENT_CHANNEL',
] as const;

/**
 * The positions of a key factor card's fields after the five it shares with
 * its attributes, `[ kind, label, current, previous, sharePct ]`. The encoder
 * leaves out the trailing fields that have no value.
 */
export const KEY_FACTOR_CARD_URL = 5;
export const KEY_FACTOR_CARD_SHARE_BASIS = 6;
export const KEY_FACTOR_CARD_PARENT_CHANNEL = 7;
export const KEY_FACTOR_CARD_PARENT_CHANNEL_CHANGE = 8;

/**
 * The position of an attribute's field after the five it shares with its card:
 * `true` when the attribute moved further than its card, the same way. The
 * encoder leaves it out otherwise.
 */
export const KEY_FACTOR_ATTRIBUTE_OVERSIZED = 5;

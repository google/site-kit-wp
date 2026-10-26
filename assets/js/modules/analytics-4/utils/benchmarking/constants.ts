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
] as const;

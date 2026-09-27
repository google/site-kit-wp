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
export const MEMBER_DAILY_VISITORS = 3;
export const MEMBER_VISITOR_TOTALS = 4;
export const MEMBER_DIMENSION_ROWS = 5;
export const MEMBER_DIMENSION_ORDER = 6;

/**
 * The dimension codes, in the order they travel as. A dimension's position in
 * this list is the index the encoded response carries.
 */
export const BENCHMARKING_DIMENSION_CODES = [
	'CHANNELS',
	'DEVICES',
	'VISITOR_MIX',
	'REFERRERS',
	'SEARCH_QUERIES',
	'CONTENT',
	'CATEGORIES',
] as const;

/**
 * The `contextualData` key each dimension code decodes to.
 */
export const BENCHMARKING_CONTEXTUAL_DATA_KEYS = {
	CHANNELS: 'channels',
	DEVICES: 'devices',
	VISITOR_MIX: 'visitorMix',
	REFERRERS: 'referrers',
	SEARCH_QUERIES: 'searchQueries',
	CONTENT: 'content',
	CATEGORIES: 'categories',
} as const;

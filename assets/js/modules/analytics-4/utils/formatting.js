/**
 * Formatting helpers.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Converts ampersand HTML entities into characters.
 *
 * @since 1.152.0
 *
 * @param {string} input Input string.
 * @return {string} String with ampersand converted to char, if present.
 */
export function decodeAmpersand( input ) {
	return input.replace( /&amp;/gi, '&' );
}

/**
 * Splits a string of categories separated by ; and returns an array of categories.
 * Decodes ampersands before doing so.
 *
 * @since 1.152.0
 *
 * @param {string} input Input string containing categories separated by ;.
 * @return {Array.<string>} Array of categories.
 */
export function splitCategories( input ) {
	return decodeAmpersand( input ).split( '; ' );
}

/**
 * Escape URI components utility.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Escapes URI components in a template string as a tag function.
 *
 * @example
 * // escape redirect url
 * const redirectTo = 'http://localhost/admin/';
 * const loginUrl = escapeURI`http://localhost/login?redirect=${ redirectTo }`;
 *
 * @since 1.11.0
 *
 * @param {string[]} strings The array of static strings in the template.
 * @param {...*}     values  The array of expressions used in the template.
 * @return {string} Escaped URI string.
 */
export function escapeURI( strings, ...values ) {
	return strings.reduce( ( acc, string, idx ) => {
		return acc + string + encodeURIComponent( values[ idx ] || '' );
	}, '' );
}

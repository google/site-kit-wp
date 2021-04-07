/**
 * Validation utilities.
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
 * Checks if the given publication ID appears to be a valid.
 *
 * @since 1.29.0
 *
 * @param {string} publicationID Publication ID to test.
 * @return {boolean} `true` if the given publication ID is valid, `false` otherwise.
 */
export function isValidPublicationID( publicationID ) {
	// TODO: Add better validation.
	return typeof publicationID === 'string' && /^[a-z0-9_.-]+[a-z]$/.test( publicationID );
}

/**
 * Checks if the given products string appears to be a valid.
 *
 * @since 1.29.0
 *
 * @param {string} products Products to test.
 * @return {boolean} `true` if the given products string is valid, `false` otherwise.
 */
export function isValidProducts( products ) {
	// TODO: Add better validation.
	return typeof products === 'string' && products.trim().length > 0;
}

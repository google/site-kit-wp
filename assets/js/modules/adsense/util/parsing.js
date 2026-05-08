/**
 * Parsing utilities.
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
 * Internal dependencies
 */
import { isValidAccountID, isValidClientID } from './validation';

/**
 * Parses the AdSense account ID from a given AdSense client ID.
 *
 * @since 1.9.0
 *
 * @param {string} clientID AdSense client ID.
 * @return {(string|undefined)} AdSense account ID, or undefined if invalid client ID.
 */
export function parseAccountID( clientID ) {
	if ( ! isValidClientID( clientID ) ) {
		return undefined;
	}
	return clientID.match( /pub-\d+$/ )[ 0 ];
}

/**
 * Parses the AdSense account ID from an existing tag.
 *
 * @since 1.105.0
 *
 * @param {string} existingTag Existing tag.
 * @return {(string|undefined)} AdSense account ID, or undefined if invalid tag.
 */
export function parseAccountIDFromExistingTag( existingTag ) {
	if ( ! isValidAccountID( existingTag ) ) {
		return undefined;
	}
	return existingTag.match( /pub-\d+$/ )[ 0 ];
}

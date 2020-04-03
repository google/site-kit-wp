/**
 * Parsing utilities.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * @since n.e.x.t
 *
 * @param {string} clientID AdSense client ID.
 * @return {?string} AdSense account ID, or undefined if invalid client ID.
 */
export function parseAccountID( clientID ) {
	if ( ! isValidClientID( clientID ) ) {
		return undefined;
	}
	return clientID.match( /pub-\d+$/ )[ 0 ];
}

/**
 * Parses the AdSense client ID of type AFC from a given AdSense account ID.
 *
 * @since n.e.x.t
 *
 * @param {string} accountID AdSense account ID.
 * @return {?string} AdSense AFC client ID, or undefined if invalid account ID.
 */
export function parseAFCClientID( accountID ) {
	if ( ! isValidAccountID( accountID ) ) {
		return undefined;
	}
	return `ca-${ accountID }`;
}

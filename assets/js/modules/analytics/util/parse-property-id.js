/**
 * Property ID parser.
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

import { isValidPropertyID } from './validation';

/**
 * Parses the bits of a valid property ID into an object of its components.
 *
 * @since n.e.x.t
 *
 * @see {@link https://support.google.com/analytics/answer/7372977}
 * @param {string} propertyID Property ID to parse.
 * @return {?Object} Object of property ID components if valid, otherwise false.
 */
export default function parsePropertyID( propertyID ) {
	if ( ! isValidPropertyID( propertyID ) ) {
		return false;
	}
	const [ , accountID, number ] = propertyID.match( /^UA-(\d+)-(\d+)/ );

	return {
		accountID,
		propertyID,
		number,
	};
}

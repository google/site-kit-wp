/**
 * AdSense Date utilities.
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
 * @since n.e.x.t
 * @see (@link https://developers.google.com/adsense/management/reference/rest/v2/Date)
 *
 * @typedef {Object} AdSenseDate
 * @property {number} year  Full year (integer).
 * @property {number} month Month number (1-based integer).
 * @property {number} day   Day number (1-based integer).
 */

/**
 * Converts an AdSense date to Date instance.
 *
 * @since n.e.x.t
 *
 * @param {AdSenseDate} adsenseDate AdSense date object.
 * @return {Date} Date instance.
 */
export function adsenseDateToInstance( { year = 0, month = 1, day = 0 } = {} ) {
	return new Date( year, month - 1, day );
}

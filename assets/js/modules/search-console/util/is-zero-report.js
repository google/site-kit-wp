/**
 * Report utilities.
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
 * Checks whether the report data is valid.
 *
 * @since 1.22.0
 *
 * @param {Object} report Report data object.
 * @return {(boolean|undefined)} Returns undefined if in the loading state, true if the report has no data or missing data, otherwise false.
 */
export function isZeroReport( report ) {
	if ( report === undefined ) {
		return undefined;
	}

	if ( ! Array.isArray( report ) || ! report.length ) {
		return true;
	}

	const hasMetric = report.some(
		( value ) =>
			value.clicks > 0 ||
			value.ctr > 0 ||
			value.impressions > 0 ||
			value.position > 0
	);

	if ( ! hasMetric ) {
		return true;
	}

	// false means there _is_ valid report data
	return false;
}

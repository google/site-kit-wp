/**
 * Google Tag utilities.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * Determines the best Google Tag ID to use from the Google Tag IDs array present in a container response.
 *
 * @since 1.98.0
 *
 * @param {Array}  tagIDs        Array of tag IDs.
 * @param {string} measurementID This will be preferred over other tags that start with "G-" in the array.
 * @return {string} Gets the best possible Google Tag ID to set in the plugin from an array of Google Tag IDs.
 */
export function getBestTagID( tagIDs, measurementID ) {
	// If there is only one tag id in the array, return it.
	if ( tagIDs.length === 1 ) {
		return tagIDs[ 0 ];
	}

	// If there are multiple tags, return the first one that starts with `GT-`.
	const gtTagID = tagIDs.find(
		( tagID ) => tagID.substring( 0, 3 ) === 'GT-'
	);
	if ( gtTagID ) {
		return gtTagID;
	}

	// Otherwise, return the `measurement_id` if it is in the array.
	if ( tagIDs.includes( measurementID ) ) {
		return measurementID;
	}

	// Otherwise, return the first one that starts with `G-`.
	const gTagID = tagIDs.find( ( tagID ) => tagID.substring( 0, 2 ) === 'G-' );
	if ( gTagID ) {
		return gTagID;
	}

	// If none of the above, return the first one.
	return tagIDs[ 0 ];
}

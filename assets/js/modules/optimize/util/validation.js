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
 * Checks if the given Optimize Container ID appears to be a valid.
 *
 * @since 1.10.0
 *
 * @param {string|number} optimizeID Optimize Container ID to test.
 * @return {boolean} `true` if the given optimize container ID is valid, `false` otherwise.
 */
export function isValidOptimizeID( optimizeID ) {
	return (
		typeof optimizeID === 'string' &&
		/^(GTM|OPT)-[A-Z0-9]+$/.test( optimizeID )
	);
}

/**
 * Checks if the given AmpExperimentJSON appears to be a valid.
 *
 * @since 1.10.0
 *
 * @param {string|number} ampExperimentJSON `ampExperimentJSON` to test.
 * @return {boolean} True if the given ampExperimentJSON is valid, false otherwise.
 */
export function isValidAMPExperimentJSON( ampExperimentJSON ) {
	if ( ! ampExperimentJSON ) {
		return true;
	}

	if ( typeof ampExperimentJSON !== 'string' ) {
		return false;
	}

	try {
		JSON.parse( ampExperimentJSON );
		return true;
	} catch {
		return false;
	}
}

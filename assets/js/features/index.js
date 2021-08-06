/**
 * Feature flags.
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

export const enabledFeatures = new Set(
	global?._googlesitekitBaseData?.enabledFeatures || []
);

/**
 * Returns true if a feature is enabled; false otherwise.
 *
 * @since 1.25.0
 * @since 1.33.0 Changed _enabledFeatures argument to be a `Set` instead of `Array`.
 *
 * @param {string} feature            The name of the feature to check.
 * @param {Set}    [_enabledFeatures] Optional. The set of enabled features. Uses `enabledFeatures` set by the server in a global JS variable, by default.
 * @return {boolean} `true` if a feature is enabled; `false` otherwise.
 */
export const isFeatureEnabled = (
	feature,
	_enabledFeatures = enabledFeatures
) => {
	if ( ! ( _enabledFeatures instanceof Set ) ) {
		return false;
	}
	return _enabledFeatures.has( feature );
};

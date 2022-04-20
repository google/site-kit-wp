/**
 * Feature Flags hook.
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
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FeaturesContext from '../components/FeaturesProvider/FeaturesContext';
import { isFeatureEnabled } from '../features';

/**
 * Returns the enabled state of a feature flag.
 *
 * @since 1.25.0
 *
 * @param {string} feature The feature flag name to check enabled state for.
 * @return {boolean} `true` if the feature is enabled, `false` otherwise.
 */
export const useFeature = ( feature ) => {
	const enabledFeatures = useContext( FeaturesContext );

	return isFeatureEnabled( feature, enabledFeatures );
};

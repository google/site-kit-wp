/**
 * Feature card CTA label utility.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { FEATURE_SETUP_TYPES } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { Feature } from '@/js/googlesitekit/datastore/feature-discovery/types';

/**
 * Gets the setup CTA label shown on a feature card.
 *
 * The card uses a generic label, while the detail panel keeps the
 * feature-specific `ctaLabel` from the feature's registration.
 *
 * @since 1.193.0
 *
 * @param {Feature} feature The feature to get the card CTA label for.
 * @return {string} The card CTA label.
 */
export default function getFeatureCardCTALabel( feature: Feature ): string {
	if ( feature.setup.type === FEATURE_SETUP_TYPES.IN_PLACE_PANEL ) {
		return __( 'Try it now', 'google-site-kit' );
	}

	return __( 'Set up now', 'google-site-kit' );
}

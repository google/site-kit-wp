/**
 * Feature Discovery registrations for the PageSpeed Insights module.
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
import {
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type { FeatureDiscoveryAPI } from '@/js/googlesitekit/feature-discovery/types';
import { MODULE_SLUG_PAGESPEED_INSIGHTS } from '@/js/modules/pagespeed-insights/constants';

/**
 * Registers PageSpeed Insights module features in the Feature Discovery catalog.
 *
 * @since n.e.x.t
 *
 * @param {FeatureDiscoveryAPI} featureDiscoveryAPI Feature Discovery API instance.
 * @return {void}
 */
export function registerFeatures( featureDiscoveryAPI: FeatureDiscoveryAPI ) {
	const { registerFeature } = featureDiscoveryAPI;

	registerFeature( 'pagespeed-insights', {
		title: __( 'PageSpeed Insights', 'google-site-kit' ),
		shortDescription: __(
			'Monitor your site speed and get actionable recommendations',
			'google-site-kit'
		),
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.PERFORMANCE ],
		addedInVersion: '1.0.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
			ctaLabel: __( 'Set up PageSpeed Insights', 'google-site-kit' ),
			moduleSlug: MODULE_SLUG_PAGESPEED_INSIGHTS,
		},
	} );
}

/**
 * Feature Discovery registrations for the Sign in with Google module.
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
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/constants';

/**
 * Registers Sign in with Google module features in the Feature Discovery catalog.
 *
 * @since n.e.x.t
 *
 * @param {FeatureDiscoveryAPI} featureDiscoveryAPI Feature Discovery API instance.
 * @return {void}
 */
export function registerFeatures( featureDiscoveryAPI: FeatureDiscoveryAPI ) {
	const { registerFeature } = featureDiscoveryAPI;

	registerFeature( 'sign-in-with-google', {
		title: __( 'Sign in with Google', 'google-site-kit' ),
		shortDescription: __(
			'Boost onboarding and security with one-click sign-in',
			'google-site-kit'
		),
		effort: FEATURE_EFFORTS.MEDIUM,
		goalCategories: [
			FEATURE_CATEGORIES.ENGAGEMENT,
			FEATURE_CATEGORIES.PRIVACY,
		],
		addedInVersion: '1.54.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
			ctaLabel: __( 'Set up Sign in with Google', 'google-site-kit' ),
			moduleSlug: MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
		},
	} );
}

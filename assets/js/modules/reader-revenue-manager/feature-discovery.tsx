/**
 * Feature Discovery registrations for the Reader Revenue Manager module.
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
import { isFeatureEnabled } from '@/js/features';
import {
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import type { FeatureDiscoveryAPI } from '@/js/googlesitekit/feature-discovery/types';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { EXPRESS_SETUP_CTAS } from '@/js/modules/reader-revenue-manager/datastore/constants';

/**
 * Registers Reader Revenue Manager module features in the Feature Discovery catalog.
 *
 * @since n.e.x.t
 *
 * @param {FeatureDiscoveryAPI} featureDiscoveryAPI Feature Discovery API instance.
 * @return {void}
 */
export function registerFeatures( featureDiscoveryAPI: FeatureDiscoveryAPI ) {
	const { registerFeature } = featureDiscoveryAPI;

	registerFeature( 'reader-revenue-manager', {
		title: __( 'Reader Revenue Manager', 'google-site-kit' ),
		shortDescription: __(
			'Open up new revenue opportunities while growing your audience',
			'google-site-kit'
		),
		effort: FEATURE_EFFORTS.HIGH,
		goalCategories: [
			FEATURE_CATEGORIES.MONETIZATION,
			FEATURE_CATEGORIES.ENGAGEMENT,
		],
		addedInVersion: '1.66.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
			ctaLabel: __( 'Set up Reader Revenue Manager', 'google-site-kit' ),
			moduleSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
		},
		checkRequirements: ( select ) => {
			// The site must use HTTPS to set up RRM.
			const homeURL = select( CORE_SITE ).getHomeURL();
			return homeURL ? homeURL.startsWith( 'https://' ) : false;
		},
	} );

	// Newsletter sign-up sub-feature (only if rrmExpressSetup feature flag is enabled).
	if ( isFeatureEnabled( 'rrmExpressSetup' ) ) {
		registerFeature( 'newsletter-signup', {
			title: __( 'Newsletter sign-up form', 'google-site-kit' ),
			shortDescription: __(
				'Collect reader emails directly on your site',
				'google-site-kit'
			),
			effort: FEATURE_EFFORTS.MEDIUM,
			goalCategories: [ FEATURE_CATEGORIES.ENGAGEMENT ],
			prerequisiteModules: [ MODULE_SLUG_READER_REVENUE_MANAGER ],
			addedInVersion: '1.96.0',
			setup: {
				type: FEATURE_SETUP_TYPES.SETUP_FLOW,
				ctaLabel: __( 'Set up newsletter sign-up', 'google-site-kit' ),
				getSetupURL: ( select ) => {
					return select( CORE_SITE ).getAdminURL(
						'googlesitekit-dashboard',
						{
							slug: MODULE_SLUG_READER_REVENUE_MANAGER,
							reAuth: true,
							expressSetup: true,
							cta: EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
						}
					);
				},
				isEnabled: ( select ) => {
					// Check if the newsletter CTA is configured.
					const settings = select(
						'modules/reader-revenue-manager'
					).getSettings();

					if ( ! settings || ! settings.configuredCTAs ) {
						return false;
					}

					return Object.values( settings.configuredCTAs ).includes(
						EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP
					);
				},
			},
			checkRequirements: ( select ) => {
				// The site must use HTTPS.
				const homeURL = select( CORE_SITE ).getHomeURL();
				return homeURL ? homeURL.startsWith( 'https://' ) : false;
			},
		} );
	}
}

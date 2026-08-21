/**
 * Feature Discovery registrations for the AdSense module.
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
import topEarningPagesWidgetScreenshotURL from '@/images/feature-discovery-hub/analytics/Key-metrics-widget.png';
import adSensePerformanceWidgetScreenshotURL from '@/images/feature-discovery-hub/analytics/Site-goals-widget.png';
import {
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type { FeatureDiscoveryAPI } from '@/js/googlesitekit/feature-discovery/types';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';

/**
 * Registers AdSense module features in the Feature Discovery catalog.
 *
 * @since n.e.x.t
 *
 * @param {FeatureDiscoveryAPI} featureDiscoveryAPI Feature Discovery API instance.
 * @return {void}
 */
export function registerFeatures( featureDiscoveryAPI: FeatureDiscoveryAPI ) {
	const { registerFeature } = featureDiscoveryAPI;

	registerFeature( 'adsense', {
		title: __( 'Place ads on your site', 'google-site-kit' ),
		shortDescription: __(
			'Monetize your content with relevant ads displayed on your website by earning revenue based on clicks or impressions.',
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					'AdSense provides an automated way to monetize your site by matching high-quality, relevant advertisements to your unique content. Site Kit takes care of the technical side by placing the necessary code across your site ensuring it adheres to best practices so you can focus on publishing. You get a birds-eye view of your earnings and ad performance trends directly within the Site Kit dashboard, helping you make informed decisions about your site’s growth.',
					'google-site-kit'
				),
				whyUseHeading: __( 'Why use AdSense?', 'google-site-kit' ),
				whyUseList: [
					{
						term: __(
							'Generate consistent revenue:',
							'google-site-kit'
						),
						description: __(
							'Turn site traffic into reliable earnings.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Show relevant ads:', 'google-site-kit' ),
						description: __(
							'Display interest-based ads that maintain your professional look.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Save time:', 'google-site-kit' ),
						description: __(
							'Let automation handle ad management so you can focus on content.',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				serviceRequirements: __(
					'Requires approval from AdSense of your account and site. Approval times may vary from a few days to several weeks.',
					'google-site-kit'
				),
				setupList: [
					__(
						'Create a new AdSense account or use your existing account.',
						'google-site-kit'
					),
					__(
						'Wait for your AdSense account and site to be approved.',
						'google-site-kit'
					),
					__(
						'Enable ad blocking recovery (optional).',
						'google-site-kit'
					),
				],
				setupComplete: __(
					"You're ready to generate revenue with AdSense!",
					'google-site-kit'
				),
			},
			screenshots: [
				{
					src: topEarningPagesWidgetScreenshotURL,
					alt: __(
						'Top earning pages widget showing top pages and earnings data.',
						'google-site-kit'
					),
					width: 1371,
					height: 421,
				},
				{
					src: adSensePerformanceWidgetScreenshotURL,
					alt: __(
						'AdSense performance widget showing key metrics and trends.',
						'google-site-kit'
					),
					width: 1478,
					height: 825,
				},
			],
		},
		successNotice: {
			title: __( 'Success! AdSense is set up', 'google-site-kit' ),
			description: __(
				'You are now monetizing your website with relevant ads.',
				'google-site-kit'
			),
			cta: {
				label: __( 'Show me', 'google-site-kit' ),
			},
			dismissLabel: __( 'Got it', 'google-site-kit' ),
		},
		effort: FEATURE_EFFORTS.HIGH,
		goalCategories: [ FEATURE_CATEGORIES.MONETIZATION ],
		addedInVersion: '1.0.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
			ctaLabel: __( 'Set up AdSense', 'google-site-kit' ),
			moduleSlug: MODULE_SLUG_ADSENSE,
		},
	} );
}

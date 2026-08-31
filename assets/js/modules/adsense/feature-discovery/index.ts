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
import {
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type { FeatureDiscoveryAPI } from '@/js/googlesitekit/feature-discovery/types';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import splashScreenScreenshotURL from '@/svg/graphics/splash-screenshot-mobile.svg?path';

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
					'You’re ready to generate revenue with AdSense!',
					'google-site-kit'
				),
			},
			screenshots: [
				{
					src: splashScreenScreenshotURL,
					alt: __(
						'Top earning pages widget showing top pages and earnings data.',
						'google-site-kit'
					),
					width: 659,
					height: 577,
				},
			],
		},
		successNotice: {
			title: __( 'Success! AdSense is set up', 'google-site-kit' ),
			description: __(
				'You are now monetizing your website with relevant ads',
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

	registerFeature( 'ad-blocker-detection', {
		title: __( 'Recover revenue lost to ad blockers', 'google-site-kit' ),
		shortDescription: __(
			'Display a message to visitors using an ad blocker, giving them the option to allow ads on your site. Site Kit will place an ad blocking recovery tag on your site.',
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					'Ad blocking recovery is a feature provided by AdSense that allows publishers to display a message to their site visitors who are using an ad blocker, encouraging them to disable it for their site which can result in revenue being recovered. This is accomplished by enabling an ad blocker recovery message on your website. Site Kit integrates this directly with AdSense to predefine the wording in the message that appears to users of ad blockers.',
					'google-site-kit'
				),
				whyUseHeading: __(
					'Why use ad blocking recovery?',
					'google-site-kit'
				),
				whyUseList: [
					{
						term: __( 'Reclaims lost revenue:', 'google-site-kit' ),
						description: __(
							'Prompts ad-blocking visitors to whitelist your site or allow ads to recover earnings. ',
							'google-site-kit'
						),
					},
					{
						term: __( 'Zero custom coding:', 'google-site-kit' ),
						description: __(
							"Deploys easily via WordPress without altering your site's codebase.",
							'google-site-kit'
						),
					},
					{
						term: __( 'Flexible enforcement:', 'google-site-kit' ),
						description: __(
							'Customize your recovery messaging and rules directly inside AdSense.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Seamless integration:', 'google-site-kit' ),
						description: __(
							'Works smoothly alongside your existing privacy and consent tools.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Error protection:', 'google-site-kit' ),
						description: __(
							'Includes fallback code to ensure messages appear even if ad blockers try to hide the prompt.',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				serviceRequirements: __(
					'There are no service requirements for Ad blocking recovery.',
					'google-site-kit'
				),
				setupList: [
					__( 'Enable ad blocking recovery.', 'google-site-kit' ),
					__(
						'Create your ad blocking recovery message.',
						'google-site-kit'
					),
				],
				setupComplete: __(
					'You are saving lost revenue! Ad blocking recovery is set up for your site.',
					'google-site-kit'
				),
			},
			screenshots: [
				{
					src: splashScreenScreenshotURL,
					alt: __(
						'Analytics 4 Key Metrics widget showing selected key metrics and trends.',
						'google-site-kit'
					),
					width: 1488,
					height: 608,
				},
			],
		},
		successNotice: {
			title: __(
				'Success! The ad blocking recovery message has been enabled',
				'google-site-kit'
			),
			description: __(
				"Make sure to also create the message in AdSense, otherwise this feature won't work.",
				'google-site-kit'
			),
			dismissLabel: __( 'Got it', 'google-site-kit' ),
		},
		effort: FEATURE_EFFORTS.MEDIUM,
		goalCategories: [ FEATURE_CATEGORIES.MONETIZATION ],
		prerequisiteModules: [ 'adsense' ],
		addedInVersion: '1.49.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
		},
	} );
}

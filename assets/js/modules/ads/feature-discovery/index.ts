/**
 * Feature Discovery registrations for the Ads module.
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
	FEATURE_BADGES,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type { FeatureDiscoveryAPI } from '@/js/googlesitekit/feature-discovery/types';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import adsCampaignOverviewScreenshotURL from '@/svg/screenshots/ads-campaign-overview.svg?path';
import adsPaxSetupScreenshotURL from '@/svg/screenshots/ads-pax-setup.svg?path';
import adsSetupFlowInputAddedScreenshotURL from '@/svg/screenshots/ads-setup-flow-input-added.svg?path';

/**
 * Registers Ads module features in the Feature Discovery catalog.
 *
 * @since 1.188.0
 *
 * @param {FeatureDiscoveryAPI} featureDiscoveryAPI Feature Discovery API instance.
 * @return {void}
 */
export function registerFeatures( featureDiscoveryAPI: FeatureDiscoveryAPI ) {
	const { registerFeature } = featureDiscoveryAPI;

	registerFeature( 'ads', {
		name: __( 'Ads', 'google-site-kit' ),
		moduleSlug: MODULE_SLUG_ADS,
		title: __( 'Increase your visibility in Search', 'google-site-kit' ),
		shortDescription: __(
			'Appear in search results when people look for keywords related to what you offer. Ads helps you connect with people at the moment they’re actively interested in your services or products.',
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					'Ads is designed to help you grow your reach by connecting you with people actively searching for your content, services, or products. Instead of manually managing tracking codes, Site Kit handles the technical heavy lifting of implementing conversion tracking for you. This ensures you can measure exactly how your ads drive results, helping you optimize your budget and reach your target audience more efficiently.',
					'google-site-kit'
				),
				whyUseHeading: __( 'Why use Ads?', 'google-site-kit' ),
				whyUseList: [
					{
						term: __( 'Accelerate growth', 'google-site-kit' ),
						description: __(
							'Reach your target audience instantly, bypassing organic wait times',
							'google-site-kit'
						),
					},
					{
						term: __( 'Drive quality traffic', 'google-site-kit' ),
						description: __(
							'Send visitors directly to your most important pages',
							'google-site-kit'
						),
					},
					{
						term: __( 'Scale results', 'google-site-kit' ),
						description: __(
							'Boost conversions while keeping full control of your budget',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				documentationURL:
					'https://sitekit.withgoogle.com/documentation/supported-services/ads/',
				serviceRequirements: __(
					'When setting up a new Ads account you will need your business information, a conversion goal, ad information and images, preferred search terms, a geographical area to display the ad, a campaign budget, billing information and payment details',
					'google-site-kit'
				),
				setupList: [
					__( 'Choose your Google Ads account', 'google-site-kit' ),
					{
						label: __( 'Connect your account', 'google-site-kit' ),
						subSteps: [
							__(
								'New account: Set up your account, campaign and payment details.',
								'google-site-kit'
							),
							__(
								'Existing account: Enter your Ads conversion ID.',
								'google-site-kit'
							),
						],
					},
					__(
						'Turn on plugin conversion tracking in Settings (optional)',
						'google-site-kit'
					),
					__(
						'Turn on Google tag gateway for advertisers in Settings (optional)',
						'google-site-kit'
					),
					__(
						"Ads is set up! You're reaching more people.",
						'google-site-kit'
					),
				],
			},
			screenshots: [
				{
					src: adsCampaignOverviewScreenshotURL,
					alt: __(
						'Screenshot of the Google Ads campaign overview showing a performance summary chart of clicks and impressions over the last 30 days, so you can see how your campaign is performing',
						'google-site-kit'
					),
					width: 620,
					height: 404,
				},
				{
					src: adsSetupFlowInputAddedScreenshotURL,
					alt: __(
						'Screenshot of the Ads setup screen in Site Kit with two options: set up a new Ads account, or connect an existing account by entering its Conversion ID',
						'google-site-kit'
					),
					width: 620,
					height: 340,
				},
				{
					src: adsPaxSetupScreenshotURL,
					alt: __(
						'Screenshot of the first step of creating a new Ads account in Site Kit, asking for your business name',
						'google-site-kit'
					),
					width: 620,
					height: 416,
				},
			],
		},
		successNotice: {
			title: __( 'Success! Ads is set up', 'google-site-kit' ),
			description: __(
				'You can now track conversions for your Ads campaigns',
				'google-site-kit'
			),
			cta: {
				label: __( 'Manage account in Ads', 'google-site-kit' ),
				getURL: ( select ) =>
					select( CORE_MODULES ).getDetailsLinkURL( MODULE_SLUG_ADS ),
				external: true,
			},
			dismissLabel: __( 'Got it', 'google-site-kit' ),
		},
		effort: FEATURE_EFFORTS.HIGH,
		goalCategories: [ FEATURE_CATEGORIES.TRAFFIC ],
		addedInVersion: '1.125.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
			ctaLabel: __( 'Set up Ads', 'google-site-kit' ),
			moduleSlug: MODULE_SLUG_ADS,
		},
		badges: [ FEATURE_BADGES.PAID_SERVICE ],
	} );
}

/**
 * Feature Discovery registrations for the Analytics module.
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
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import splashScreenScreenshotURL from '@/svg/graphics/splash-screenshot-mobile.svg?path';

/**
 * Registers Analytics module features in the Feature Discovery catalog.
 *
 * @since n.e.x.t
 *
 * @param {FeatureDiscoveryAPI} featureDiscoveryAPI Feature Discovery API instance.
 * @return {void}
 */
export function registerFeatures( featureDiscoveryAPI: FeatureDiscoveryAPI ) {
	const { registerFeature } = featureDiscoveryAPI;

	registerFeature( 'analytics', {
		title: __(
			'Understand how visitors interact with your content',
			'google-site-kit'
		),
		shortDescription: __(
			'Track your traffic, see which pages perform best, and learn what keeps your audience coming back. Analytics gives you the clear data you need to optimize your user experience and turn casual visitors into loyal customers.',
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					"Analytics turns your site’s traffic into a clear story. It doesn't just count visitors, it reveals which pages are most engaging, where your audience discovers your site, and how they move through your content. Site Kit brings these insights into a single dashboard, removing the need for extra browser tabs or complex data tools so you can focus on what’s actually working.",
					'google-site-kit'
				),
				whyUseHeading: __( 'Why use Analytics?', 'google-site-kit' ),
				whyUseList: [
					{
						term: __( 'Decide with data:', 'google-site-kit' ),
						description: __(
							'Replace guesswork with clear insights. ',
							'google-site-kit'
						),
					},
					{
						term: __( 'Track what works:', 'google-site-kit' ),
						description: __(
							'Pinpoint your most popular content and traffic sources.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Boost performance:', 'google-site-kit' ),
						description: __(
							'Optimize your site based on real visitor behavior.',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				serviceRequirements: __(
					'A "gathering data" message will be displayed to users with newly created Analytics properties. All Anallytics data is subject to processing delays, which typically take 2 to 6 hours to process new traffic information.',
					'google-site-kit'
				),
				setupList: [
					__(
						'Create a new Analytics account or use your existing account.',
						'google-site-kit'
					),
					__(
						'Select your preferred property and web data stream.',
						'google-site-kit'
					),
					__(
						'Enable enhanced measurements (optional).',
						'google-site-kit'
					),
				],
				setupComplete: __(
					'Analytics is set up! You are now capturing useful data for your site.',
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
					width: 659,
					height: 577,
				},
				{
					src: splashScreenScreenshotURL,
					alt: __(
						'Analytics 4 Site Goals widget showing progress for configured goals.',
						'google-site-kit'
					),
					width: 659,
					height: 577,
				},
				{
					src: splashScreenScreenshotURL,
					alt: __(
						'Analytics 4 Top Content widget showing top pages and engagement data.',
						'google-site-kit'
					),
					width: 659,
					height: 577,
				},
				{
					src: splashScreenScreenshotURL,
					alt: __(
						'Analytics 4 Traffic widget showing traffic trends and channels.',
						'google-site-kit'
					),
					width: 659,
					height: 577,
				},
				{
					src: splashScreenScreenshotURL,
					alt: __(
						'Analytics 4 Visitor Groups widget showing audience segment performance.',
						'google-site-kit'
					),
					width: 659,
					height: 577,
				},
			],
		},
		successNotice: {
			title: __( 'Success! Analytics is set up', 'google-site-kit' ),
			description: __(
				'Analytics data is now on your dashboard.',
				'google-site-kit'
			),
			cta: {
				label: __( 'Show me', 'google-site-kit' ),
			},
			dismissLabel: __( 'Got it', 'google-site-kit' ),
		},
		effort: FEATURE_EFFORTS.MEDIUM,
		goalCategories: [
			FEATURE_CATEGORIES.AUDIENCE,
			FEATURE_CATEGORIES.ENGAGEMENT,
			FEATURE_CATEGORIES.TRAFFIC,
			FEATURE_CATEGORIES.PERFORMANCE,
			FEATURE_CATEGORIES.PRODUCTIVITY,
		],
		addedInVersion: '1.0.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
			ctaLabel: __( 'Set up Analytics', 'google-site-kit' ),
			moduleSlug: MODULE_SLUG_ANALYTICS_4,
		},
	} );
}

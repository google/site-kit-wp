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
import kmwWidgetScreenshotURL from '@/svg/graphics/kmw-widget.svg?path';
import splashScreenScreenshotURL from '@/svg/graphics/splash-screenshot-mobile.svg?path';
import visitorGroupsScreenshotURL from '@/svg/graphics/visitor-groups.svg?path';

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
					'A "gathering data" message will be displayed to users with newly created Analytics properties. All Analytics data is subject to processing delays, which typically take 2 to 6 hours to process new traffic information.',
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
	registerFeature( 'key-metrics', {
		title: __(
			'Get personalized suggestions for user interaction metrics based on your goals',
			'google-site-kit'
		),
		shortDescription: __(
			'Key metrics allows each user to pin their most important goals to the top of the Site Kit dashboard for a customized view that can be changed at any time',
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					"Key metrics allows you to tailor your Site Kit dashboard to show the top metrics most relevant to your site's goals. These are pinned to the top of the Site Kit dashboard, highlighing what's most important for you. After answering a few questions about your site, Site Kit will pre-select a list of key metrics to help you understand how users interact with your site and what drives progress toward your goals. You can also customize this widget and define your own metrics in order to focus on the metrics that matter most to you.",
					'google-site-kit'
				),
				whyUseHeading: __( 'Why use key metrics?', 'google-site-kit' ),
				whyUseList: [
					{
						term: __( 'Pin metrics:', 'google-site-kit' ),
						description: __(
							'Attach your most critical GA4 metrics directly to your main WordPress dashboard.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Team alignment:', 'google-site-kit' ),
						description: __(
							'Keep everyone focused on core goals with a simplified performance view.',
							'google-site-kit'
						),
					},
					{
						term: __( 'At-a-glance data:', 'google-site-kit' ),
						description: __(
							'View vital performance stats immediately upon logging in.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Save time:', 'google-site-kit' ),
						description: __(
							'Skip navigating through complex external Analytics menus.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Spot trends:', 'google-site-kit' ),
						description: __(
							'Instantly recognize traffic spikes, drops, and changing user patterns.',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				serviceRequirements: __(
					'There are no service requirements for key metrics.',
					'google-site-kit'
				),
				setupList: [
					__(
						'Answer questions about the goal of your site',
						'google-site-kit'
					),
				],
				setupComplete: __(
					'Your key metrics are set up! You can select which metrics to display and view them on your Site Kit dashboard.',
					'google-site-kit'
				),
			},
			screenshots: [
				{
					src: kmwWidgetScreenshotURL,
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
			title: __( 'Success! Key metrics are set up', 'google-site-kit' ),
			cta: {
				label: __( 'Show me', 'google-site-kit' ),
			},
			dismissLabel: __( 'Got it', 'google-site-kit' ),
		},
		effort: FEATURE_EFFORTS.MEDIUM,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		prerequisiteModules: [ 'analytics-4' ],
		addedInVersion: '1.65.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
		},
	} );

	registerFeature( 'enhanced-measurement', {
		title: __( 'Enhance your site tracking', 'google-site-kit' ),
		shortDescription: __(
			'Better understand what visitors do on your site with detailed tracking',
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					'Enhanced Measurement is a feature in Analytics that automatically tracks common user interactions on your website. Such user interactions include page views, scrolling events, clicking outbound links, viewing internal search results, form submissions, video plays and file downloads. Previously, capturing these measurements would require specific configuration for each event defining tags, triggers, and variables inside Google Tag Manager.',
					'google-site-kit'
				),
				whyUseHeading: __(
					'Why use enhanced measurement?',
					'google-site-kit'
				),
				whyUseList: [
					{
						term: __( 'Saves time:', 'google-site-kit' ),
						description: __(
							'Automates event tracking immediately with a single toggle.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Zero coding:', 'google-site-kit' ),
						description: __(
							'Tracks file downloads, video plays, and outbound clicks without developer help.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Immediate data:', 'google-site-kit' ),
						description: __(
							'Collects baseline user behavior data from the moment it is turned on.',
							'google-site-kit'
						),
					},
					{
						term: __( 'No Tag Manager needed:', 'google-site-kit' ),
						description: __(
							'Eliminates complex setup by running directly through your standard tracking.',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				serviceRequirements: __(
					'There are no service requirements for enhanced measurement.',
					'google-site-kit'
				),
				setupList: [
					__(
						'Enable enhanced measurement for Analytics.',
						'google-site-kit'
					),
					__(
						'View your enhanced measurement data in your Analytics account.',
						'google-site-kit'
					),
				],
				setupComplete: __(
					'You are now tracking enhanced measurement data.',
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
				'Success! Enhanced measurement is now active',
				'google-site-kit'
			),
			description: __(
				'You are now automatically tracking valuable interactions like file downloads and video plays.',
				'google-site-kit'
			),
			dismissLabel: __( 'Got it', 'google-site-kit' ),
		},
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		prerequisiteModules: [ 'analytics-4' ],
		addedInVersion: '1.49.0',
		setup: {
			type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
		},
	} );

	registerFeature( 'visitor-groups', {
		title: __( 'Learn about your visitor groups', 'google-site-kit' ),
		shortDescription: __(
			'Segment your visitors into categories that help you understand site behaviour for demographcs of subsets of visitors that you define',
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					'Visitor groups allow you to gain deeper insights into your website visitors. It uses Analytics audiences to allow you to view data for a dynamically grouped subset of your website visitors who share similar behaviors, demographics, or traits that you can define.',
					'google-site-kit'
				),
				whyUseHeading: __(
					'Why use visitor groups?',
					'google-site-kit'
				),
				whyUseList: [
					{
						term: __( 'Segment traffic:', 'google-site-kit' ),
						description: __(
							'Group visitors by criteria like traffic source or new versus returning directly in WordPress.',
							'google-site-kit'
						),
					},
					{
						term: __(
							'Side-by-side comparison:',
							'google-site-kit'
						),
						description: __(
							'Easily compare key performance metrics across different audience segments simultaneously.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Identify top content:', 'google-site-kit' ),
						description: __(
							'Pinpoint exactly which posts and pages resonate best with specific audience types.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Tailored insights:', 'google-site-kit' ),
						description: __(
							'Uncover deep audience behavior patterns to improve user engagement and retention.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Data-driven decisions:', 'google-site-kit' ),
						description: __(
							'Optimize your site strategy using segment-specific data without leaving your dashboard.',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				serviceRequirements: __(
					'There are no service requirements for visitor groups.',
					'google-site-kit'
				),
				setupList: [
					__(
						'Enable visitor groups here [CTA for setup]',
						'google-site-kit'
					),
				],
				setupComplete: __(
					"You're all set! Your visitor groups can be found and configured on your Site Kit dashboard.",
					'google-site-kit'
				),
			},
			screenshots: [
				{
					src: visitorGroupsScreenshotURL,
					alt: __(
						'Visitor groups screenshot showing audiences tiles.',
						'google-site-kit'
					),
					width: 1488,
					height: 608,
				},
			],
		},
		successNotice: {
			title: __(
				'Success! Visitor groups are enabled',
				'google-site-kit'
			),
			cta: {
				label: __( 'Show me', 'google-site-kit' ),
			},
			dismissLabel: __( 'Got it', 'google-site-kit' ),
		},
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		prerequisiteModules: [ 'analytics-4' ],
		addedInVersion: '1.127.0',
		setup: {
			type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
		},
	} );
}

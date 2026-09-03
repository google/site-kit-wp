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
import splashScreenScreenshotURL from '@/svg/graphics/splash-screenshot-mobile.svg?path';

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
		title: __(
			'Make your web pages fast on all devices',
			'google-site-kit'
		),
		shortDescription: __(
			'PageSpeed Insights (PSI) reports on the user experience of a page on both mobile and desktop devices, and provides suggestions on how that page may be improved',
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					'PageSpeed Insights acts as a performance coach, analyzing your site’s load times and responsiveness for both mobile and desktop users. It gives you a clear performance score and, more importantly, provides a checklist of specific, actionable steps you can take to make your site faster, smoother, and more reliable for your readers. A fast website is essential for keeping visitors engaged and improving your search rankings.',
					'google-site-kit'
				),
				whyUseHeading: __(
					'Why use PageSpeed Insights?',
					'google-site-kit'
				),
				whyUseList: [
					{
						term: __( 'Boost rankings:', 'google-site-kit' ),
						description: __(
							'Improve search visibility and user satisfaction with faster load times.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Retain visitors:', 'google-site-kit' ),
						description: __(
							'Reduce bounce rates by keeping your site snappy and responsive.',
							'google-site-kit'
						),
					},
					{
						term: __(
							'Fix performance issues:',
							'google-site-kit'
						),
						description: __(
							'Quickly identify and resolve bottlenecks for a competitive edge.',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				serviceRequirements: __(
					'There are no service requirements for PageSpeed Insights.',
					'google-site-kit'
				),
				setupList: [
					__(
						'Connect the PageSpeed Insights module.',
						'google-site-kit'
					),
				],
				setupComplete: __(
					'PageSpeed Insights is set up! You can now see your site’s load times and responsiveness for both mobile and desktop users.',
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
			title: __(
				'Success! PageSpeed Insights is set up',
				'google-site-kit'
			),
			cta: {
				label: __( 'Show me', 'google-site-kit' ),
			},
			dismissLabel: __( 'Got it', 'google-site-kit' ),
		},
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

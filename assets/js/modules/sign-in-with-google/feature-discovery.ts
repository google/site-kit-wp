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
import splashScreenScreenshotURL from '@/svg/graphics/splash-screenshot-mobile.svg?path';

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
		title: __(
			'Boost onboarding, security, and trust on your site using Sign in with Google',
			'google-site-kit'
		),
		shortDescription: __(
			'Provide your site visitors with a simple, secure, and personalized experience by adding a Sign in with Google button to your login page',
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					'Sign in with Google replaces long, repetitive registration forms with a fast, secure, and familiar sign-in experience. By allowing visitors to use their existing Google credentials to access your site, you significantly reduce friction during the login process. It builds immediate trust with your audience while making it easier for you to grow a community of registered users, ultimately leading to higher engagement and more returning visitors.',
					'google-site-kit'
				),
				whyUseHeading: __(
					'Why use Sign in with Google?',
					'google-site-kit'
				),
				whyUseList: [
					{
						term: __( 'Reduce friction:', 'google-site-kit' ),
						description: __(
							'Eliminate long registration forms and password fatigue.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Boost conversions:', 'google-site-kit' ),
						description: __(
							'Make signing up a simple, one-click process.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Grow your community:', 'google-site-kit' ),
						description: __(
							'Increase returning visitors and build deeper user connections.',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				serviceRequirements: __(
					'Access to the Google Cloud Platform is required to create a project and obtain OAuth credentials (Client ID). Your site must allow user registration (Settings > General) if you want to use the Sign in with Google "One Tap" option.',
					'google-site-kit'
				),
				setupList: [
					__( 'Create a Google Cloud project', 'google-site-kit' ),
					__(
						'Enter your Google Cloud project client ID',
						'google-site-kit'
					),
					__( 'Enable one-tap (optional).', 'google-site-kit' ),
				],
				setupComplete: __(
					'Users can now sign in with Google to your site.',
					'google-site-kit'
				),
			},
			screenshots: [
				{
					src: splashScreenScreenshotURL,
					alt: __(
						'Custom page showing Sign in with Google integration.',
						'google-site-kit'
					),
					width: 659,
					height: 577,
				},
				{
					src: splashScreenScreenshotURL,
					alt: __(
						'WordPress login page showing Sign in with Google integration.',
						'google-site-kit'
					),
					width: 659,
					height: 577,
				},
			],
		},
		successNotice: {
			title: __(
				'Success! Sign in with Google is set up',
				'google-site-kit'
			),
			description: __(
				'Sign in with Google button was added to your site login page. You can customize the button appearance in settings.',
				'google-site-kit'
			),
			cta: {
				label: __( 'Customize settings', 'google-site-kit' ),
			},
			dismissLabel: __( 'Maybe later', 'google-site-kit' ),
		},
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

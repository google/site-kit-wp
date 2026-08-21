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
import rrm01ContributionScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/01_contribution.png';
import rrm01PaywalledContentScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/01_paywalled_content.png';
import promptNewsletterSignupScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/newsletter-signup/prompt_newsletter_signup.png';
import signupFormDashboardScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/newsletter-signup/Sign-up-form-dashboard.png';
import rrmPageLevelSettingsScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/page_level_settings.png';
import rrmPromptAccessForRegisteredReadersScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/prompt_access_for_registered_readers.png';
import rrmPromptCustomCTAScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/prompt_customCTA.png';
import rrmPromptNewReaderPaywallScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/prompt_newreader_paywall.png';
import rrmPromptNewsletterSignupScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/prompt_newsletter_signup.png';
import rrmPromptPaywallScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/prompt_paywall.png';
import rrmPromptReaderRegistrationScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/prompt_reader_registration.png';
import rrmPromptSurveyScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/prompt_survey.png';
import rrmSettingsScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/settings.png';
import rrmWordPressEditorActiveButtonScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/wordpress_editor_active_button.png';
import rrmWordPressEditorSelectingButtonScreenshotURL from '@/images/feature-discovery-hub/reader-revenue-manager/wordpress_editor_selecting_button.png';
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
		title: __(
			'Open up new revenue opportunities while growing, retaining and engaging your audience',
			'google-site-kit'
		),
		shortDescription: __(
			'Add easy-to-implement subscription and contribution prompts to your site, or non-monetized prompts such as newsletter signups, surveys, subscriptions and more.',
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					'Reader Revenue Manager helps publishers without an existing membership model incorporate a subscription or contribution model into their desktop and mobile web pages. You can use Reader Revenue Manager to help increase reader engagement and retention through features like newsletter sign-up, surveys and reader registrations.',
					'google-site-kit'
				),
				whyUseHeading: __(
					'Why use Reader Revenue Manager?',
					'google-site-kit'
				),
				whyUseList: [
					{
						term: __( 'Earn money:', 'google-site-kit' ),
						description: __(
							'Flexible monetization lets you accept direct contributions or subscriptions from your readers.',
							'google-site-kit'
						),
					},
					{
						term: __(
							'Improved visitor retention:',
							'google-site-kit'
						),
						description: __(
							'Build an engaged community using dedicated subscriber perks and newsletter signups.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Easy setup:', 'google-site-kit' ),
						description: __(
							'Launch the entire platform directly onto your site with zero coding required.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Collect feedback:', 'google-site-kit' ),
						description: __(
							'Gather valuable audience insights by running quick, native surveys.',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				serviceRequirements: __(
					'Sites will be subject to Reader Revenue Manager approval processes, which can take from a few hours to a few days.',
					'google-site-kit'
				),
				setupList: [
					__(
						'Create a new Publisher Center publication or use an existing publication',
						'google-site-kit'
					),
					__( 'Set up features', 'google-site-kit' ),
				],
				setupComplete: __(
					"You're all set! Reader Revenue Manager setup is complete.",
					'google-site-kit'
				),
			},
			screenshots: [
				{
					src: rrm01ContributionScreenshotURL,
					alt: __(
						'Reader Revenue Manager contribution prompt screenshot.',
						'google-site-kit'
					),
					width: 2285,
					height: 1705,
				},
				{
					src: rrm01PaywalledContentScreenshotURL,
					alt: __(
						'Reader Revenue Manager paywalled content screenshot.',
						'google-site-kit'
					),
					width: 2565,
					height: 1732,
				},
				{
					src: rrmPageLevelSettingsScreenshotURL,
					alt: __(
						'Reader Revenue Manager page level settings screenshot.',
						'google-site-kit'
					),
					width: 667,
					height: 640,
				},
				{
					src: rrmPromptAccessForRegisteredReadersScreenshotURL,
					alt: __(
						'Reader Revenue Manager registered readers prompt screenshot.',
						'google-site-kit'
					),
					width: 1677,
					height: 910,
				},
				{
					src: rrmPromptCustomCTAScreenshotURL,
					alt: __(
						'Reader Revenue Manager custom CTA prompt screenshot.',
						'google-site-kit'
					),
					width: 1365,
					height: 924,
				},
				{
					src: rrmPromptNewReaderPaywallScreenshotURL,
					alt: __(
						'Reader Revenue Manager new reader paywall prompt screenshot.',
						'google-site-kit'
					),
					width: 1505,
					height: 927,
				},
				{
					src: rrmPromptNewsletterSignupScreenshotURL,
					alt: __(
						'Reader Revenue Manager newsletter signup prompt screenshot.',
						'google-site-kit'
					),
					width: 1590,
					height: 1012,
				},
				{
					src: rrmPromptPaywallScreenshotURL,
					alt: __(
						'Reader Revenue Manager paywall prompt screenshot.',
						'google-site-kit'
					),
					width: 1542,
					height: 1445,
				},
				{
					src: rrmPromptReaderRegistrationScreenshotURL,
					alt: __(
						'Reader Revenue Manager reader registration prompt screenshot.',
						'google-site-kit'
					),
					width: 1590,
					height: 1097,
				},
				{
					src: rrmPromptSurveyScreenshotURL,
					alt: __(
						'Reader Revenue Manager survey prompt screenshot.',
						'google-site-kit'
					),
					width: 2090,
					height: 1626,
				},
				{
					src: rrmSettingsScreenshotURL,
					alt: __(
						'Reader Revenue Manager settings screen screenshot.',
						'google-site-kit'
					),
					width: 3262,
					height: 1400,
				},
				{
					src: rrmWordPressEditorActiveButtonScreenshotURL,
					alt: __(
						'Reader Revenue Manager WordPress editor active button screenshot.',
						'google-site-kit'
					),
					width: 852,
					height: 523,
				},
				{
					src: rrmWordPressEditorSelectingButtonScreenshotURL,
					alt: __(
						'Reader Revenue Manager WordPress editor button selection screenshot.',
						'google-site-kit'
					),
					width: 883,
					height: 885,
				},
			],
		},
		effort: FEATURE_EFFORTS.HIGH,
		goalCategories: [
			FEATURE_CATEGORIES.MONETIZATION,
			FEATURE_CATEGORIES.ENGAGEMENT,
		],
		addedInVersion: '1.66.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
			ctaLabel: __( 'Set up Reader Revenur Manager', 'google-site-kit' ),
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
			title: __(
				'Collect reader emails directly on your site',
				'google-site-kit'
			),
			shortDescription: __(
				'Add a simple sign-up form to your site so readers can share their email addresses with you. It’s an easy, privacy-safe way to start building a list of your most interested visitors.',
				'google-site-kit'
			),
			detail: {
				description: {
					whatIs: __(
						'Reader Revenue Manager newsletter sign-ups allow you to place a direct subscription prompt on your site to grow your email list. It seamlessly integrates with your existing email service provider, allowing you to capture reader emails and nurture a direct relationship with your audience beyond their visits to your site.',
						'google-site-kit'
					),
					whyUseHeading: __(
						'Why use newsletter sign-up forms?',
						'google-site-kit'
					),
					whyUseList: [
						{
							term: __(
								'Drive repeat traffic:',
								'google-site-kit'
							),
							description: __(
								'Build a direct connection with your audience via email.',
								'google-site-kit'
							),
						},
						{
							term: __( 'Boost engagement:', 'google-site-kit' ),
							description: __(
								'Keep readers coming back with timely updates and exclusive content.',
								'google-site-kit'
							),
						},
						{
							term: __( 'Own your growth:', 'google-site-kit' ),
							description: __(
								'Reduce reliance on social media and search algorithms.',
								'google-site-kit'
							),
						},
						{
							term: __(
								'Convert strategically:',
								'google-site-kit'
							),
							description: __(
								'Use intelligent prompts to turn casual visitors into loyal subscribers.',
								'google-site-kit'
							),
						},
					],
				},
				requirements: {
					serviceRequirements: __(
						'A supported email service provider (e.g., Mailchimp, Substack, etc.) is required for the collected email data to be sent.',
						'google-site-kit'
					),
					setupList: [
						__(
							'Create a new Publisher Center publication or use an existing publication',
							'google-site-kit'
						),
						__(
							'Set up a newsletter sign-up form',
							'google-site-kit'
						),
					],
					setupComplete: __(
						'Your newsletter sign-up form for Reader Revenue Manager is set up.',
						'google-site-kit'
					),
				},
				screenshots: [
					{
						src: promptNewsletterSignupScreenshotURL,
						alt: __(
							'Reader Revenue Manager newsletter sign-up prompt screenshot.',
							'google-site-kit'
						),
						width: 1590,
						height: 1012,
					},
					{
						src: signupFormDashboardScreenshotURL,
						alt: __(
							'Reader Revenue Manager newsletter sign-up form dashboard screenshot.',
							'google-site-kit'
						),
						width: 820,
						height: 227,
					},
				],
			},
			successNotice: {
				title: __(
					'Success! Your Newsletter sign-up form by Reader Revenue Manager is set up',
					'google-site-kit'
				),
				description: __(
					'You can always update your sign-up form settings in Publisher center.',
					'google-site-kit'
				),
				cta: {
					label: __( 'Go to Publisher center', 'google-site-kit' ),
				},
				dismissLabel: __( 'Got it', 'google-site-kit' ),
			},
			effort: FEATURE_EFFORTS.MEDIUM,
			goalCategories: [ FEATURE_CATEGORIES.ENGAGEMENT ],
			prerequisiteModules: [ MODULE_SLUG_READER_REVENUE_MANAGER ],
			addedInVersion: '1.96.0',
			setup: {
				type: FEATURE_SETUP_TYPES.SETUP_FLOW,
				ctaLabel: __( 'Set up a sign-up form', 'google-site-kit' ),
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

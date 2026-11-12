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
import type { Registry, Select } from 'googlesitekit-data';
import { isFeatureEnabled } from '@/js/features';
import {
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import type { FeatureDiscoveryAPI } from '@/js/googlesitekit/feature-discovery/types';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { EXPRESS_SETUP_SCOPES } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	EXPRESS_SETUP_CTAS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import type { ConfiguredCTA } from '@/js/modules/reader-revenue-manager/datastore/types';
import contributionPromptScreenshotURL from '@/svg/screenshots/reader-revenue-manager-contribution-prompt.svg?path';
import customCTAScreenshotURL from '@/svg/screenshots/reader-revenue-manager-custom-cta.svg?path';
import newReaderPaywallScreenshotURL from '@/svg/screenshots/reader-revenue-manager-new-reader-paywall.svg?path';
import newsletterSignUpFormPromptScreenshotURL from '@/svg/screenshots/reader-revenue-manager-newsletter-sign-up-form-prompt.svg?path';
import newsletterSignUpFormSetupScreenshotURL from '@/svg/screenshots/reader-revenue-manager-newsletter-sign-up-form-setup.svg?path';
import paywalledContentScreenshotURL from '@/svg/screenshots/reader-revenue-manager-paywalled-content.svg?path';
import readerRegistrationScreenshotURL from '@/svg/screenshots/reader-revenue-manager-reader-registration.svg?path';
import registeredReadersScreenshotURL from '@/svg/screenshots/reader-revenue-manager-registered-readers.svg?path';
import surveyPromptScreenshotURL from '@/svg/screenshots/reader-revenue-manager-survey-prompt.svg?path';
import { FEATURE_SLUG_NEWSLETTER_SIGNUP } from './constants';

/**
 * Registers Reader Revenue Manager module features in the Feature Discovery catalog.
 *
 * @since 1.188.0
 *
 * @param {FeatureDiscoveryAPI} featureDiscoveryAPI Feature Discovery API instance.
 * @return {void}
 */
export function registerFeatures( featureDiscoveryAPI: FeatureDiscoveryAPI ) {
	const { registerFeature } = featureDiscoveryAPI;

	registerFeature( 'reader-revenue-manager', {
		name: __( 'Reader Revenue Manager', 'google-site-kit' ),
		moduleSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
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
						term: __( 'Earn money', 'google-site-kit' ),
						description: __(
							'Flexible monetization lets you accept direct contributions or subscriptions from your readers',
							'google-site-kit'
						),
					},
					{
						term: __(
							'Improved visitor retention',
							'google-site-kit'
						),
						description: __(
							'Build an engaged community using dedicated subscriber perks and newsletter signups',
							'google-site-kit'
						),
					},
					{
						term: __( 'Easy setup', 'google-site-kit' ),
						description: __(
							'Launch the entire platform directly onto your site with zero coding required',
							'google-site-kit'
						),
					},
					{
						term: __( 'Collect feedback', 'google-site-kit' ),
						description: __(
							'Gather valuable audience insights by running quick, native surveys',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				documentationURL:
					'https://support.google.com/news/publisher-center/answer/11449914?hl=en-GB&ref_topic=11493750&sjid=4921721547083949313-SA',
				serviceRequirements: __(
					'Sites will be subject to Reader Revenue Manager approval processes, which can take from a few hours to a few days',
					'google-site-kit'
				),
				setupList: [
					__(
						'Create a new Publisher Center publication or use an existing publication',
						'google-site-kit'
					),
					__( 'Set up features', 'google-site-kit' ),
					__(
						'You’re all set! Reader Revenue Manager setup is complete.',
						'google-site-kit'
					),
				],
			},
			screenshots: [
				{
					src: contributionPromptScreenshotURL,
					alt: __(
						'Screenshot of a Reader Revenue Manager prompt over an article, asking readers to make a monthly contribution with their Google Account',
						'google-site-kit'
					),
					width: 620,
					height: 463,
				},
				{
					src: paywalledContentScreenshotURL,
					alt: __(
						'Screenshot of a Reader Revenue Manager paywall over an article, offering readers a choice of subscription plans with a free trial',
						'google-site-kit'
					),
					width: 620,
					height: 463,
				},
				{
					src: registeredReadersScreenshotURL,
					alt: __(
						'Screenshot of a Reader Revenue Manager prompt over an article, telling a registered reader they have used up their free content and asking them to subscribe',
						'google-site-kit'
					),
					width: 620,
					height: 463,
				},
				{
					src: customCTAScreenshotURL,
					alt: __(
						'Screenshot of a custom call to action prompt from Reader Revenue Manager over an article, with a button that links to another page',
						'google-site-kit'
					),
					width: 620,
					height: 463,
				},
				{
					src: newReaderPaywallScreenshotURL,
					alt: __(
						'Screenshot of a Reader Revenue Manager prompt over an article, telling a new reader how many free articles they can read each week and asking them to subscribe',
						'google-site-kit'
					),
					width: 620,
					height: 463,
				},
				{
					src: newsletterSignUpFormPromptScreenshotURL,
					alt: __(
						'Screenshot of a newsletter sign-up prompt over an article, asking readers to sign up to the newsletter with their Google Account',
						'google-site-kit'
					),
					width: 620,
					height: 395,
				},
				{
					src: readerRegistrationScreenshotURL,
					alt: __(
						'Screenshot of a Reader Revenue Manager prompt over an article, inviting readers to register for free with their Google Account to get access to more articles',
						'google-site-kit'
					),
					width: 620,
					height: 463,
				},
				{
					src: surveyPromptScreenshotURL,
					alt: __(
						'Screenshot of a Reader Revenue Manager survey prompt over a page, asking readers a multiple choice question about themselves',
						'google-site-kit'
					),
					width: 620,
					height: 483,
				},
			],
		},
		effort: FEATURE_EFFORTS.HIGH,
		goalCategories: [
			FEATURE_CATEGORIES.AUDIENCE,
			FEATURE_CATEGORIES.MONETIZATION,
			FEATURE_CATEGORIES.TRAFFIC,
		],
		addedInVersion: '1.129.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
			ctaLabel: __( 'Set up Reader Revenue Manager', 'google-site-kit' ),
			moduleSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
		},
	} );

	// Newsletter sign-up sub-feature (only if rrmExpressSetup feature flag is enabled).
	if ( isFeatureEnabled( 'rrmExpressSetup' ) ) {
		const newsletterSignupReauthOptions = {
			additionalScopes: EXPRESS_SETUP_SCOPES,
			redirectQueryArgs: {
				cta: EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
				expressSetup: 'true',
			},
		};

		registerFeature( FEATURE_SLUG_NEWSLETTER_SIGNUP, {
			name: __( 'Newsletter sign-up form', 'google-site-kit' ),
			moduleSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
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
								'Drive repeat traffic',
								'google-site-kit'
							),
							description: __(
								'Build a direct connection with your audience via email',
								'google-site-kit'
							),
						},
						{
							term: __( 'Boost engagement', 'google-site-kit' ),
							description: __(
								'Keep readers coming back with timely updates and exclusive content',
								'google-site-kit'
							),
						},
						{
							term: __( 'Own your growth', 'google-site-kit' ),
							description: __(
								'Reduce reliance on social media and search algorithms',
								'google-site-kit'
							),
						},
						{
							term: __(
								'Convert strategically',
								'google-site-kit'
							),
							description: __(
								'Use intelligent prompts to turn casual visitors into loyal subscribers',
								'google-site-kit'
							),
						},
					],
				},
				requirements: {
					documentationURL:
						'https://support.google.com/news/publisher-center/answer/12813936?hl=en-GB&sjid=16842124317358157127-EU#zippy=%2Ccreate-a-newsletter-sign-up-form:~:text=Create%20a%20newsletter%20sign%2Dup%20form',
					serviceRequirements: __(
						'A supported email service provider (e.g., Mailchimp, Substack, etc.) is required for the collected email data to be sent',
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
						__(
							'Your newsletter sign-up form for Reader Revenue Manager is set up',
							'google-site-kit'
						),
					],
				},
				screenshots: [
					{
						src: newsletterSignUpFormSetupScreenshotURL,
						alt: __(
							'Screenshot of the Reader Revenue Manager sign-up form setup in Site Kit, with fields for the form name, header and body text, options for collecting names and consent, and a preview of how the form will look',
							'google-site-kit'
						),
						width: 620,
						height: 632,
					},
					{
						src: newsletterSignUpFormPromptScreenshotURL,
						alt: __(
							'Screenshot of a newsletter sign-up prompt over an article, asking readers to sign up to the newsletter with their Google Account',
							'google-site-kit'
						),
						width: 620,
						height: 395,
					},
				],
			},
			successNotice: {
				title: __(
					'Success! Your Newsletter sign-up form by Reader Revenue Manager is set up',
					'google-site-kit'
				),
				description: __(
					'You can always update your sign-up form settings in Publisher center',
					'google-site-kit'
				),
				cta: {
					label: __( 'Go to Publisher center', 'google-site-kit' ),
					getURL: ( select ) =>
						select( CORE_MODULES ).getDetailsLinkURL(
							MODULE_SLUG_READER_REVENUE_MANAGER
						),
					external: true,
				},
				dismissLabel: __( 'Got it', 'google-site-kit' ),
			},
			effort: FEATURE_EFFORTS.MEDIUM,
			goalCategories: [ FEATURE_CATEGORIES.ENGAGEMENT ],
			addedInVersion: '1.188.0', // ToDo: Update with the version number when the feature is released.
			setup: {
				type: FEATURE_SETUP_TYPES.SETUP_FLOW,
				ctaLabel: __( 'Set up a sign-up form', 'google-site-kit' ),
				moduleSlug: MODULE_SLUG_READER_REVENUE_MANAGER,
				getSetupURL: ( select: Select ) =>
					select( MODULES_READER_REVENUE_MANAGER ).getAdminReauthURL(
						newsletterSignupReauthOptions
					),
				getResumeURL: ( select: Select ) =>
					select( MODULES_READER_REVENUE_MANAGER ).getAdminReauthURL(
						newsletterSignupReauthOptions
					),
				isInProgress: ( select: Select ) => {
					const isModuleActive = select(
						CORE_MODULES
					).isModuleActive( MODULE_SLUG_READER_REVENUE_MANAGER );

					if ( isModuleActive !== true ) {
						return isModuleActive;
					}

					const userSettings = select(
						MODULES_READER_REVENUE_MANAGER
					).getUserSettings();

					if ( userSettings === undefined ) {
						return undefined;
					}

					const { lastActionedExpressSetups = {} } = userSettings;

					return (
						`${ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP }:new` in
						lastActionedExpressSetups
					);
				},
				// Connecting RRM doesn't mean a newsletter form exists, so
				// completion is based on the publication's configured CTAs.
				isEnabled: ( select: Select ) => {
					const isModuleActive = select(
						CORE_MODULES
					).isModuleActive( MODULE_SLUG_READER_REVENUE_MANAGER );

					if ( isModuleActive !== true ) {
						return isModuleActive;
					}

					const configuredCTAs = select(
						MODULES_READER_REVENUE_MANAGER
					).getConfiguredCTAs() as
						| Record< string, ConfiguredCTA >
						| undefined;

					if ( configuredCTAs === undefined ) {
						return undefined;
					}

					return Object.values( configuredCTAs ).some(
						( { type } ) =>
							type === EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP
					);
				},
			},
			incompleteSetupReminder: {
				title: __(
					'Almost there! Finish your newsletter sign-up form',
					'google-site-kit'
				),
				description: __(
					'Complete setup to make it live and start building a list of your most interested visitors',
					'google-site-kit'
				),
				tooltip: __(
					'You can always complete your sign-up form setup from the “Add features” page',
					'google-site-kit'
				),
				resolveRequirements: async ( {
					select,
					resolveSelect,
				}: Registry ) => {
					await resolveSelect( CORE_MODULES ).getModules();

					const isModuleActive = select(
						CORE_MODULES
					).isModuleActive( MODULE_SLUG_READER_REVENUE_MANAGER );

					if ( ! isModuleActive ) {
						return;
					}

					const resolveAdminReauthURL = resolveSelect(
						MODULES_READER_REVENUE_MANAGER
					).getAdminReauthURL( newsletterSignupReauthOptions );

					const resolveSettings = resolveSelect(
						MODULES_READER_REVENUE_MANAGER
					).getSettings();

					const resolveUserSettings = resolveSelect(
						MODULES_READER_REVENUE_MANAGER
					).getUserSettings();

					await Promise.all( [
						resolveAdminReauthURL,
						resolveSettings,
						resolveUserSettings,
					] );
				},
			},
		} );
	}
}

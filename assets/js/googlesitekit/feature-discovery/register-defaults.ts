/**
 * Feature Discovery default catalog registrations.
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import type { FeatureDiscoveryAPI } from '@/js/googlesitekit/feature-discovery/types';
import dashboardSharingScreenshotURL from '@/svg/graphics/dashboard-sharing.svg?path';
import kmwWidgetScreenshotURL from '@/svg/graphics/kmw-widget.svg?path';
import pdfReportFullScreenshotURL from '@/svg/graphics/pdf-report-full.svg?path';
import pdfReportPanelScreenshotURL from '@/svg/graphics/pdf-report-panel.svg?path';
import splashScreenScreenshotURL from '@/svg/graphics/splash-screenshot-mobile.svg?path';
import visitorGroupsScreenshotURL from '@/svg/graphics/visitor-groups.svg?path';

/**
 * Registers default features from core Site Kit and modules.
 *
 * Individual modules contribute their own features from their index.ts entrypoint.
 *
 * @since n.e.x.t
 *
 * @param {FeatureDiscoveryAPI} featureDiscoveryAPI Feature Discovery API instance.
 * @return {void}
 */
export function registerDefaults( featureDiscoveryAPI: FeatureDiscoveryAPI ) {
	const { registerFeature } = featureDiscoveryAPI;

	registerFeature( 'dashboard-sharing', {
		title: __(
			'Collaborate with other team members by sharing dashboard access',
			'google-site-kit'
		),
		shortDescription: __(
			'Give other users access to Site Kit dashboard and insights without sharing your Google account credentials.',
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					'Dashboard sharing allows users with the Administrator user role to share a restricted view of the Site Kit dashboard, WordPress dashboard summary widget, and toolbar with other user roles, including non-administrators.',
					'google-site-kit'
				),
				whyUseHeading: __(
					'Why use dashboard sharing?',
					'google-site-kit'
				),
				whyUseList: [
					{
						term: __( 'Share data safely:', 'google-site-kit' ),
						description: __(
							'Grant access to Site Kit metrics without sharing your Google account login details.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Role-based access:', 'google-site-kit' ),
						description: __(
							'Easily manage view-only permissions for specific WordPress roles like Editor or Author.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Client reporting:', 'google-site-kit' ),
						description: __(
							'Show stakeholders real-time site performance data directly within their WordPress dashboard.',
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
						term: __( 'Protect settings:', 'google-site-kit' ),
						description: __(
							'Keep your connected Google service configurations safe from unauthorized changes.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Streamline reporting:', 'google-site-kit' ),
						description: __(
							'Empower your team with self-service access to insights on their own time.',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				serviceRequirements: __(
					'Dashboard sharing only works with WordPress user roles. This includes any custom user roles.',
					'google-site-kit'
				),
				setupList: [
					__( 'Open the dashboard sharing panel', 'google-site-kit' ),
					__(
						'Select your preferred Google services to be shared',
						'google-site-kit'
					),
					__(
						'Grant permission to view data to other WordPress users, and who can manage view access',
						'google-site-kit'
					),
				],
				setupComplete: __(
					"You're done! Other users can view the Site Kit dashboard in view-only mode.",
					'google-site-kit'
				),
			},
			screenshots: [
				{
					src: dashboardSharingScreenshotURL,
					alt: __(
						'Dashboard sharing screenshot showing the dashboard sharing panel.',
						'google-site-kit'
					),
					width: 1488,
					height: 608,
				},
			],
		},
		successNotice: {
			title: __(
				'Success! Dashboard sharing is configured',
				'google-site-kit'
			),
			description: __(
				'Dashboard sharing can always be managed from the Site Kit header',
				'google-site-kit'
			),
			cta: {
				label: __( 'Manage dashboard sharing', 'google-site-kit' ),
			},
			dismissLabel: __( 'Got it', 'google-site-kit' ),
		},
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.PRODUCTIVITY ],
		addedInVersion: '1.71.0',
		setup: {
			type: FEATURE_SETUP_TYPES.IN_PLACE_PANEL,
			ctaLabel: __( 'Try it now', 'google-site-kit' ),
			open: ( registry: WPDataRegistry ) => {
				registry
					.dispatch( 'core/ui' )
					.setValue( 'dashboardSharingDialogOpen', true );
			},
			isEnabled: ( select ) => {
				const sharedModules =
					select( 'core/modules' ).getSharedModules();
				return sharedModules !== undefined && sharedModules.length > 0;
			},
		},
		checkRequirements: ( select ) => {
			return select( CORE_SITE ).hasMultipleAdmins();
		},
	} );

	registerFeature( 'email-reports', {
		title: __( 'Get site insights in your inbox', 'google-site-kit' ),
		shortDescription: __(
			"Receive the most important insights about your site's performance, key trends, and tailored metrics directly in your inbox. Invite other site users to subscribe, and manage your report frequency.",
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					'Email reports enable all users with access to the Site Kit dashboard to opt in to receive reports containing site performance metrics on a weekly, monthly, or quarterly basis. Other users can also be invited to receive email reports. The contents of the email summarize the performance of your site into easily understood sections, providing an overview of how people found your site, the most engaging content and more.',
					'google-site-kit'
				),
				whyUseHeading: __(
					'Why use email reports?',
					'google-site-kit'
				),
				whyUseList: [
					{
						term: __( 'Automated delivery:', 'google-site-kit' ),
						description: __(
							"Get an overview of your site's performance sent to your inbox at your preferred frequency.",
							'google-site-kit'
						),
					},
					{
						term: __( 'Invite others:', 'google-site-kit' ),
						description: __(
							'Share the insights by easily inviting team members or clients to receive the emails.',
							'google-site-kit'
						),
					},
					{
						term: __( 'In-box monitoring:', 'google-site-kit' ),
						description: __(
							'Track how your site is doing across key metrics without needing to log into WordPress.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Quick dashboard link:', 'google-site-kit' ),
						description: __(
							'Jump straight into deeper analysis with a convenient link back to Site Kit in every email.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Easy opt-out:', 'google-site-kit' ),
						description: __(
							'Maintain complete control over your inbox with a simple unsubscribe option available at any time.',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				serviceRequirements: __(
					'There are no service requirements for email reports.',
					'google-site-kit'
				),
				setupList: [
					__(
						'Enable email reports from Site Kit user menu',
						'google-site-kit'
					),
					__(
						'Configure your preferred schedule (weekly, monthly, or quarterly)',
						'google-site-kit'
					),
					__(
						'Invite others to receive email reports (optional)',
						'google-site-kit'
					),
				],
				setupComplete: __(
					"You're done! you will receive a confirmation email and the report will be sent automatically per your frequency selection",
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
				'Success! You’ve subscribed to email reports',
				'google-site-kit'
			),
			description: __(
				'Email subscription settings can always be edited from the Site Kit header.',
				'google-site-kit'
			),
			dismissLabel: __( 'Got it', 'google-site-kit' ),
		},
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.PRODUCTIVITY ],
		addedInVersion: '1.60.0',
		setup: {
			type: FEATURE_SETUP_TYPES.IN_PLACE_PANEL,
			ctaLabel: __( 'Try it now', 'google-site-kit' ),
			open: ( registry: WPDataRegistry ) => {
				registry
					.dispatch( 'core/ui' )
					.setValue(
						'emailReportingUserSettingsSelectionPanelOpened',
						true
					);
			},
			isEnabled: ( select ) => {
				return select( 'core/user' ).isEmailReportingSubscribed();
			},
		},
	} );

	registerFeature( 'pdf-report', {
		title: __( 'Export Site Kit to PDF report', 'google-site-kit' ),
		shortDescription: __(
			'Generate a PDF featuring the current metrics from your dashboard. The report reflects the same date range selected in your dashboard, excluding data from the current day to ensure accuracy.',
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					'In just a couple of clicks, you can export a snapshot of the Site Kit dashboard, selecting what you wish to be included, into a PDF document. By generating PDF reports, you can easily share, print or review how you site is performing, similar to how it appears on the Site Kit dashboard.',
					'google-site-kit'
				),
				whyUseHeading: __( 'Why use PDF reports?', 'google-site-kit' ),
				whyUseList: [
					{
						term: __( 'Easy download:', 'google-site-kit' ),
						description: __(
							'Save a clean, instant snapshot of your entire Site Kit dashboard with a single click.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Offline review:', 'google-site-kit' ),
						description: __(
							'Access and analyze your site’s performance data anywhere without needing an internet connection.',
							'google-site-kit'
						),
					},
					{
						term: __( 'Simple sharing:', 'google-site-kit' ),
						description: __(
							'Print or email the generated PDF directly to clients, stakeholders, or team members.',
							'google-site-kit'
						),
					},
				],
			},
			requirements: {
				serviceRequirements: __(
					'There are no service requirements for PDF reports.',
					'google-site-kit'
				),
				setupList: [
					__(
						'Open the PDF report export panel and select your preferred Google services to be included',
						'google-site-kit'
					),
					__( 'Download your report', 'google-site-kit' ),
				],
				setupComplete: __(
					"You're done! the PDF will be automatically downloaded",
					'google-site-kit'
				),
			},
			screenshots: [
				{
					src: pdfReportFullScreenshotURL,
					alt: __(
						'PDF report screenshot showing the full report with all selected metrics.',
						'google-site-kit'
					),
					width: 1488,
					height: 608,
				},
				{
					src: pdfReportPanelScreenshotURL,
					alt: __(
						'PDF report screenshot showing the export panel with selected metrics.',
						'google-site-kit'
					),
					width: 1488,
					height: 608,
				},
			],
		},
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.PRODUCTIVITY ],
		addedInVersion: '1.184.0',
		setup: {
			type: FEATURE_SETUP_TYPES.IN_PLACE_PANEL,
			ctaLabel: __( 'Try it now', 'google-site-kit' ),
			open: ( registry: WPDataRegistry ) => {
				registry
					.dispatch( 'core/ui' )
					.setValue( 'pdfDownloadPanelOpened', true );
			},
			isEnabled: () => false,
		},
	} );

	registerFeature( 'key-metrics', {
		title: __(
			'Get personalized suggestions for user interaction metrics based on your goals',
			'google-site-kit'
		),
		shortDescription: __(
			'Key metrics allows each user to pin their most important goals to the top of the Site Kit dashboard for a customized view that can be changed at any time.',
			'google-site-kit'
		),
		detail: {
			description: {
				whatIs: __(
					"Key metrics allows you to tailor your Site Kit dashboard to show the top metrics most relevant to your site’s goals. These are pinned to the top of the Site Kit dashboard, highlighing what's most important for you. After answering a few questions about your site, Site Kit will pre-select a list of key metrics to help you understand how users interact with your site and what drives progress toward your goals. You can also customize this widget and define your own metrics in order to focus on the metrics that matter most to you.",
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
						term: __( 'Team alignment:', 'google-site-kit' ),
						description: __(
							'Keep everyone focused on core goals with a simplified performance view.',
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
			ctaLabel: __( 'Configure metrics', 'google-site-kit' ),
			getSetupURL: ( select ) => {
				return select( CORE_SITE ).getAdminURL(
					'googlesitekit-user-input'
				);
			},
			isEnabled: ( select ) => {
				return select( CORE_SITE ).isKeyMetricsSetupCompleted();
			},
		},
	} );

	registerFeature( 'enhanced-measurement', {
		title: __( 'Enhance your site tracking', 'google-site-kit' ),
		shortDescription: __(
			'Better understand what visitors do on your site with detailed tracking.',
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
			ctaLabel: __( 'Enable enhanced measurements', 'google-site-kit' ),
			activate: ( registry: WPDataRegistry ) => {
				return registry
					.dispatch( 'modules/analytics-4' )
					.setEnhancedMeasurementStreamEnabled( {
						propertyID: registry
							.select( 'modules/analytics-4' )
							.getPropertyID(),
						webDataStreamID: registry
							.select( 'modules/analytics-4' )
							.getWebDataStreamID(),
						enabled: true,
					} );
			},
			isEnabled: ( select ) => {
				const propertyID = select(
					'modules/analytics-4'
				).getPropertyID();
				const webDataStreamID = select(
					'modules/analytics-4'
				).getWebDataStreamID();

				if ( ! propertyID || ! webDataStreamID ) {
					return false;
				}

				return select(
					'modules/analytics-4'
				).isEnhancedMeasurementStreamEnabled(
					propertyID,
					webDataStreamID
				);
			},
		},
	} );

	registerFeature( 'visitor-groups', {
		title: __( 'Learn about your visitor groups', 'google-site-kit' ),
		shortDescription: __(
			'Segment your visitors into categories that help you understand site behaviour for demographcs of subsets of visitors that you define.',
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
		effort: FEATURE_EFFORTS.MEDIUM,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		prerequisiteModules: [ 'analytics-4' ],
		addedInVersion: '1.127.0',
		setup: {
			type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
			ctaLabel: __( 'Enable visitor groups', 'google-site-kit' ),
			activate: ( registry: WPDataRegistry ) => {
				return registry
					.dispatch( 'modules/analytics-4' )
					.enableAudienceGroup();
			},
			isEnabled: ( select ) => {
				return select(
					'modules/analytics-4'
				).isAudienceSegmentationSetupCompleted();
			},
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
				'Make sure to also create the message in AdSense, otherwise this feature won’t work.',
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
			ctaLabel: __( 'Set up Ad blocking recovery', 'google-site-kit' ),
			getSetupURL: ( select ) => {
				return select( CORE_SITE ).getAdminURL(
					'googlesitekit-ad-blocking-recovery'
				);
			},
			isEnabled: ( select ) => {
				const adBlockingRecoverySetupStatus =
					select(
						'modules/adsense'
					).getAdBlockingRecoverySetupStatus();

				return adBlockingRecoverySetupStatus === 'setup-confirmed';
			},
		},
	} );
}

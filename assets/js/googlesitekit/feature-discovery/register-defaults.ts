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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { isFeatureEnabled } from '@/js/features';
import {
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import type { FeatureDiscoveryAPI } from '@/js/googlesitekit/feature-discovery/types';
import dashboardSharingScreenshotURL from '@/svg/graphics/dashboard-sharing.svg?path';
import pdfReportFullScreenshotURL from '@/svg/graphics/pdf-report-full.svg?path';
import pdfReportPanelScreenshotURL from '@/svg/graphics/pdf-report-panel.svg?path';
import splashScreenScreenshotURL from '@/svg/graphics/splash-screenshot-mobile.svg?path';

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
					'You’re done! Other users can view the Site Kit dashboard in view-only mode.',
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
					'You’re done! You will receive a confirmation email and the report will be sent automatically per your frequency selection',
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
		},
	} );

	if ( isFeatureEnabled( 'pdfGeneration' ) ) {
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
					whyUseHeading: __(
						'Why use PDF reports?',
						'google-site-kit'
					),
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
						'You’re done! The PDF will be automatically downloaded',
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
			},
		} );
	}
}

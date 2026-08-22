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

	// Core Site Kit feature: Dashboard Sharing
	// Gated by hasMultipleAdmins to avoid showing on single-user sites.
	registerFeature( 'dashboard-sharing', {
		title: __( 'Dashboard sharing', 'google-site-kit' ),
		shortDescription: __(
			'Share your Site Kit dashboard with team members',
			'google-site-kit'
		),
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.PRODUCTIVITY ],
		addedInVersion: '1.71.0',
		setup: {
			type: FEATURE_SETUP_TYPES.IN_PLACE_PANEL,
			ctaLabel: __( 'Set up sharing', 'google-site-kit' ),
			open: ( registry: WPDataRegistry ) => {
				// Flip the core/ui key to open the DashboardSharingDialog surface.
				registry
					.dispatch( 'core/ui' )
					.setValue( 'dashboardSharingDialogOpen', true );
			},
			isEnabled: ( select ) => {
				// The feature is considered enabled once any module is shared.
				const sharedModules =
					select( 'core/modules' ).getSharedModules();
				return sharedModules !== undefined && sharedModules.length > 0;
			},
		},
		checkRequirements: ( select ) => {
			// Hide the feature entirely on single-user sites.
			return select( CORE_SITE ).hasMultipleAdmins();
		},
	} );

	// Core Site Kit feature: Email Reports
	registerFeature( 'email-reports', {
		title: __( 'Email reports', 'google-site-kit' ),
		shortDescription: __(
			'Get regular email updates on your site performance',
			'google-site-kit'
		),
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.PRODUCTIVITY ],
		addedInVersion: '1.60.0',
		setup: {
			type: FEATURE_SETUP_TYPES.IN_PLACE_PANEL,
			ctaLabel: __( 'Set up email reports', 'google-site-kit' ),
			open: ( registry: WPDataRegistry ) => {
				// Flip the core/ui key to open the email reporting panel.
				registry
					.dispatch( 'core/ui' )
					.setValue(
						'emailReportingUserSettingsSelectionPanelOpened',
						true
					);
			},
			isEnabled: ( select ) => {
				// The feature is considered enabled once the user is subscribed.
				return select( 'core/user' ).isEmailReportingSubscribed();
			},
		},
	} );

	// Core Site Kit feature: PDF Report
	registerFeature( 'pdf-report', {
		title: __( 'PDF report', 'google-site-kit' ),
		shortDescription: __(
			'Download a PDF report of your site performance',
			'google-site-kit'
		),
		effort: FEATURE_EFFORTS.LOW,
		goalCategories: [ FEATURE_CATEGORIES.PRODUCTIVITY ],
		addedInVersion: '1.184.0',
		setup: {
			type: FEATURE_SETUP_TYPES.IN_PLACE_PANEL,
			ctaLabel: __( 'Download PDF', 'google-site-kit' ),
			open: ( registry: WPDataRegistry ) => {
				// Flip the core/ui key to open the PDF export panel.
				registry
					.dispatch( 'core/ui' )
					.setValue( 'pdfDownloadPanelOpened', true );
			},
			// No completion state; PDF export is an action, not a persistent setting.
			isEnabled: () => false,
		},
	} );

	// Core Site Kit feature: Key Metrics (depends on Analytics)
	registerFeature( 'key-metrics', {
		title: __( 'Key metrics', 'google-site-kit' ),
		shortDescription: __(
			'Configure your site goals and see the metrics that matter most',
			'google-site-kit'
		),
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

	// Enhanced measurement (depends on Analytics)
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

	// Visitor groups / Audience segmentation (depends on Analytics)
	registerFeature( 'visitor-groups', {
		title: __( 'Visitor groups', 'google-site-kit' ),
		shortDescription: __(
			'Segment your audience and see insights for different visitor groups',
			'google-site-kit'
		),
		effort: FEATURE_EFFORTS.MEDIUM,
		goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
		prerequisiteModules: [ 'analytics-4' ],
		addedInVersion: '1.127.0',
		setup: {
			type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
			ctaLabel: __( 'Set up visitor groups', 'google-site-kit' ),
			activate: ( registry: WPDataRegistry ) => {
				// Dispatches enableAudienceGroup which handles audience creation/sync.
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

	// Ad blocker detection (depends on AdSense, navigates to ABR screen)
	registerFeature( 'ad-blocker-detection', {
		title: __( 'Ad blocker detection', 'google-site-kit' ),
		shortDescription: __(
			'Recover potential lost revenue from visitors using ad blockers',
			'google-site-kit'
		),
		effort: FEATURE_EFFORTS.MEDIUM,
		goalCategories: [ FEATURE_CATEGORIES.MONETIZATION ],
		prerequisiteModules: [ 'adsense' ],
		addedInVersion: '1.49.0',
		setup: {
			type: FEATURE_SETUP_TYPES.SETUP_FLOW,
			ctaLabel: __( 'Set up', 'google-site-kit' ),
			getSetupURL: ( select ) => {
				return select( CORE_SITE ).getAdminURL(
					'googlesitekit-ad-blocking-recovery'
				);
			},
			isEnabled: ( select ) => {
				// The ABR status setting indicates whether setup is complete.
				const adBlockingRecoverySetupStatus =
					select(
						'modules/adsense'
					).getAdBlockingRecoverySetupStatus();

				return adBlockingRecoverySetupStatus === 'setup-confirmed';
			},
		},
	} );
}

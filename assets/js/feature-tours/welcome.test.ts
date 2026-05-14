/**
 * Welcome tour tests.
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
import { getWelcomeTour } from './welcome';

const KEY_METRICS_STEP = {
	target: '.googlesitekit-widget-area--mainDashboardKeyMetricsPrimary',
	floaterProps: {
		target: '.googlesitekit-km-change-metrics-cta',
	},
	title: __( 'Your goals, measured and clear', 'google-site-kit' ),
	content: __(
		'These Key Metrics show you exactly how your site is performing against the goals you set. Watch these numbers to see what’s working and what’s not.',
		'google-site-kit'
	),
	offset: -3,
	spotlightPadding: 4,
	placement: 'top-end',
	isResponsive: true,
};

const AUDIENCE_SEGMENTATION_STEP = {
	target: '.googlesitekit-widget-area--mainDashboardTrafficAudienceSegmentation',
	floaterProps: {
		target: '.googlesitekit-widget-audience-tiles__body .googlesitekit-widget--analyticsAudienceTiles:last-child .googlesitekit-audience-segmentation-tile__header-title',
	},
	title: __( 'Get to know your site visitors', 'google-site-kit' ),
	content: __(
		'Not all visitors are the same, tailor your strategy based on who you want to attract',
		'google-site-kit'
	),
	offset: 14,
	spotlightPadding: 4,
	placement: 'top',
	isResponsive: true,
};

const TRAFFIC_STEP = {
	target: '.googlesitekit-widget--analyticsAllTrafficGA4',
	floaterProps: {
		target: '.googlesitekit-widget--analyticsAllTraffic__user-count-chart',
	},
	title: __( 'Track traffic trends, identify baselines', 'google-site-kit' ),
	content: __(
		'Know what’s normal for your site. This is how you spot trends and measure real growth.',
		'google-site-kit'
	),
	offset: 35,
	spotlightPadding: 0,
	placement: 'top',
	isResponsive: true,
};

const TOP_CONTENT_STEP = {
	target: '.googlesitekit-widget--analyticsModulePopularPagesGA4',
	floaterProps: {
		target: '.googlesitekit-table__head-item--pageviews .googlesitekit-table__head-item-title',
	},
	title: __(
		'Discover your most popular and engaging content',
		'google-site-kit'
	),
	content: __(
		'Find out what your audience loves and double down on what resonates most',
		'google-site-kit'
	),
	offset: 25,
	spotlightPadding: 0,
	placement: 'top',
	isResponsive: true,
};

const TOP_SEARCH_QUERIES_STEP = {
	target: '.googlesitekit-widget--searchConsolePopularKeywords',
	floaterProps: {
		target: '.googlesitekit-widget--searchConsolePopularKeywords .googlesitekit-table__wrapper',
	},
	title: __( 'Track how your site is doing on Search', 'google-site-kit' ),
	content: __(
		'Know what’s driving growth and bringing your site more visitors',
		'google-site-kit'
	),
	offset: 0,
	spotlightPadding: 0,
	placement: 'top',
	isResponsive: true,
};

const TRAFFIC_TRENDS_STEP = {
	target: '.googlesitekit-widget--searchFunnelGA4',
	floaterProps: {
		target: '.googlesitekit-widget--searchFunnelGA4 .googlesitekit-widget__body',
	},
	title: __(
		'Track Search traffic trends, identify baselines',
		'google-site-kit'
	),
	content: __(
		'Know what’s normal for your site. This is how you spot trends and measure real growth.',
		'google-site-kit'
	),
	offset: 0,
	spotlightPadding: 0,
	placement: 'top',
	isResponsive: true,
};

const DASHBOARD_SHARING_VIEW_ONLY_AUTHENTICATED_STEP = {
	slug: 'dashboard-sharing',
	target: '.googlesitekit-header',
	floaterProps: {
		target: '.googlesitekit-view-only-menu',
		styles: {
			arrow: {
				margin: 8,
			},
		},
	},
	title: __( 'Get instant access to insights, no setup', 'google-site-kit' ),
	content: __(
		'See what’s been shared with you here, or sign in with Google to configure services and sharing access',
		'google-site-kit'
	),
	offset: 0,
	spotlightPadding: 0,
	placement: 'bottom',
};

const DASHBOARD_SHARING_VIEW_ONLY_UNAUTHENTICATED_STEP = {
	slug: 'dashboard-sharing',
	target: '.googlesitekit-header',
	floaterProps: {
		target: '.googlesitekit-view-only-menu',
		styles: {
			arrow: {
				margin: 8,
			},
		},
	},
	title: __( 'Get instant access to insights, no setup', 'google-site-kit' ),
	content: __(
		'Site admins have shared the dashboard with you, so you can keep track of how your site is doing. See what’s been shared with you here.',
		'google-site-kit'
	),
	offset: 0,
	spotlightPadding: 0,
	placement: 'bottom',
};

const DASHBOARD_SHARING_ANALYTICS_CONNECTED_STEP = {
	slug: 'dashboard-sharing',
	target: '.googlesitekit-header',
	floaterProps: {
		target: '.googlesitekit-sharing-settings__button svg',
	},
	title: __( 'Share insights with your team', 'google-site-kit' ),
	content: __(
		'Give access to your teammates or clients to view the dashboard instantly, no setup required. You control who sees what.',
		'google-site-kit'
	),
	offset: 0,
	spotlightPadding: 0,
	placement: 'bottom',
};

const DASHBOARD_SHARING_STEP = {
	slug: 'dashboard-sharing',
	target: '.googlesitekit-header',
	floaterProps: {
		target: '.googlesitekit-sharing-settings__button',
	},
	title: __( 'Share insights with your team', 'google-site-kit' ),
	content: __(
		'Give access to your teammates or clients to view the dashboard instantly, no setup required. You control who sees what.',
		'google-site-kit'
	),
	offset: 0,
	spotlightPadding: 0,
	placement: 'bottom',
};

const ACTIVATE_ANALYTICS_STEP = {
	content:
		'Get insights on how visitors navigate your site and help you achieve your goals by connecting Analytics',
	floaterProps: {
		target: '#activate-analytics-notification .googlesitekit-banner__cta',
	},
	offset: 0,
	placement: 'bottom',
	slug: 'activate-analytics',
	spotlightPadding: 0,
	target: '#activate-analytics-notification',
	title: 'Want to know what people do once they land on your site?',
};

describe( 'getWelcomeTour', () => {
	describe( 'Analytics connected tour variant', () => {
		it( 'should include the widget areas containing the tour targets in the `preloadWidgetAreas` property', () => {
			const tour = getWelcomeTour( {
				isViewOnly: false,
				canAuthenticate: true,
				isAnalyticsConnected: true,
				isActivateAnalyticsNotificationPresent: false,
				isKeyMetricsSetupCompleted: false,
				isAudienceSegmentationSetupCompleted: false,
			} );

			expect( tour.preloadWidgetAreas ).toEqual( [
				'mainDashboardKeyMetricsPrimary',
				'mainDashboardTrafficPrimary',
				'mainDashboardTrafficAudienceSegmentation',
				'mainDashboardContentPrimary',
			] );
		} );

		it( 'should return the Analytics-connected tour variant for an authenticated user', () => {
			const tour = getWelcomeTour( {
				isViewOnly: false,
				canAuthenticate: true,
				isAnalyticsConnected: true,
				isActivateAnalyticsNotificationPresent: false,
				isKeyMetricsSetupCompleted: false,
				isAudienceSegmentationSetupCompleted: false,
			} );

			expect( tour.gaEventCategory( 'test-context' ) ).toBe(
				'test-context_dashboard-tour-ga4'
			);
			expect( tour.slug ).toBe( 'welcome-with-analytics' );
			expect( tour.steps ).toEqual( [
				TRAFFIC_STEP,
				TOP_SEARCH_QUERIES_STEP,
				TOP_CONTENT_STEP,
				DASHBOARD_SHARING_ANALYTICS_CONNECTED_STEP,
			] );
			expect( tour ).toBeDefined();
		} );

		it( 'should return the Analytics-connected tour variant for a view-only user who can authenticate', () => {
			const tour = getWelcomeTour( {
				isViewOnly: true,
				canAuthenticate: true,
				isAnalyticsConnected: true,
				isActivateAnalyticsNotificationPresent: false,
				isKeyMetricsSetupCompleted: false,
				isAudienceSegmentationSetupCompleted: false,
			} );

			expect( tour.gaEventCategory( 'test-context' ) ).toBe(
				'test-context_dashboard-tour-ga4'
			);
			expect( tour.slug ).toBe( 'welcome-with-analytics' );
			expect( tour.steps ).toEqual( [
				TRAFFIC_STEP,
				TOP_SEARCH_QUERIES_STEP,
				TOP_CONTENT_STEP,
				DASHBOARD_SHARING_VIEW_ONLY_AUTHENTICATED_STEP,
			] );
		} );

		it( 'should return the Analytics-connected tour variant for a view-only user who cannot authenticate', () => {
			const tour = getWelcomeTour( {
				isViewOnly: true,
				canAuthenticate: false,
				isAnalyticsConnected: true,
				isActivateAnalyticsNotificationPresent: false,
				isKeyMetricsSetupCompleted: false,
				isAudienceSegmentationSetupCompleted: false,
			} );

			expect( tour.gaEventCategory( 'test-context' ) ).toBe(
				'test-context_dashboard-tour-ga4'
			);
			expect( tour.slug ).toBe( 'welcome-with-analytics' );
			expect( tour.steps ).toEqual( [
				TRAFFIC_STEP,
				TOP_SEARCH_QUERIES_STEP,
				TOP_CONTENT_STEP,
				DASHBOARD_SHARING_VIEW_ONLY_UNAUTHENTICATED_STEP,
			] );
		} );

		it( 'should include the key metrics step if it has been set up', () => {
			const tour = getWelcomeTour( {
				isViewOnly: false,
				canAuthenticate: true,
				isAnalyticsConnected: true,
				isActivateAnalyticsNotificationPresent: false,
				isKeyMetricsSetupCompleted: true,
				isAudienceSegmentationSetupCompleted: false,
			} );

			expect( tour.gaEventCategory( 'test-context' ) ).toBe(
				'test-context_dashboard-tour-ga4'
			);
			expect( tour.slug ).toBe( 'welcome-with-analytics' );
			expect( tour.steps ).toEqual( [
				KEY_METRICS_STEP,
				TRAFFIC_STEP,
				TOP_SEARCH_QUERIES_STEP,
				TOP_CONTENT_STEP,
				DASHBOARD_SHARING_ANALYTICS_CONNECTED_STEP,
			] );
			expect( tour ).toBeDefined();
		} );

		it( 'should include the audience segmentation step if it has been set up', () => {
			const tour = getWelcomeTour( {
				isViewOnly: false,
				canAuthenticate: true,
				isAnalyticsConnected: true,
				isActivateAnalyticsNotificationPresent: false,
				isKeyMetricsSetupCompleted: false,
				isAudienceSegmentationSetupCompleted: true,
			} );

			expect( tour.gaEventCategory( 'test-context' ) ).toBe(
				'test-context_dashboard-tour-ga4'
			);
			expect( tour.slug ).toBe( 'welcome-with-analytics' );
			expect( tour.steps ).toEqual( [
				TRAFFIC_STEP,
				AUDIENCE_SEGMENTATION_STEP,
				TOP_SEARCH_QUERIES_STEP,
				TOP_CONTENT_STEP,
				DASHBOARD_SHARING_ANALYTICS_CONNECTED_STEP,
			] );
			expect( tour ).toBeDefined();
		} );

		it( 'should not include the top search queries step if both the key metrics and audience segmentation features are set up', () => {
			const tour = getWelcomeTour( {
				isViewOnly: false,
				canAuthenticate: true,
				isAnalyticsConnected: true,
				isActivateAnalyticsNotificationPresent: false,
				isKeyMetricsSetupCompleted: true,
				isAudienceSegmentationSetupCompleted: true,
			} );

			expect( tour.gaEventCategory( 'test-context' ) ).toBe(
				'test-context_dashboard-tour-ga4'
			);
			expect( tour.slug ).toBe( 'welcome-with-analytics' );
			expect( tour.steps ).toEqual( [
				KEY_METRICS_STEP,
				TRAFFIC_STEP,
				AUDIENCE_SEGMENTATION_STEP,
				TOP_CONTENT_STEP,
				DASHBOARD_SHARING_ANALYTICS_CONNECTED_STEP,
			] );
			expect( tour ).toBeDefined();
		} );
	} );

	describe( 'Search Console only tour variant', () => {
		it( 'should include the widget areas containing the tour targets in the `preloadWidgetAreas` property', () => {
			const tour = getWelcomeTour( {
				isViewOnly: false,
				canAuthenticate: true,
				isAnalyticsConnected: false,
				isActivateAnalyticsNotificationPresent: false,
				isKeyMetricsSetupCompleted: false,
				isAudienceSegmentationSetupCompleted: false,
			} );

			expect( tour.preloadWidgetAreas ).toEqual( [
				'mainDashboardTrafficPrimary',
				'mainDashboardContentPrimary',
			] );
		} );

		it( 'should return the SC-only tour variant for an authenticated user', () => {
			const tour = getWelcomeTour( {
				isViewOnly: false,
				canAuthenticate: true,
				isAnalyticsConnected: false,
				isActivateAnalyticsNotificationPresent: false,
				isKeyMetricsSetupCompleted: false,
				isAudienceSegmentationSetupCompleted: false,
			} );

			expect( tour.gaEventCategory( 'test-context' ) ).toBe(
				'test-context_dashboard-tour-sc'
			);
			expect( tour.slug ).toBe( 'welcome-without-analytics' );
			expect( tour.steps ).toEqual( [
				TRAFFIC_TRENDS_STEP,
				TOP_SEARCH_QUERIES_STEP,
				DASHBOARD_SHARING_STEP,
			] );
		} );

		it( 'should return the SC-only tour variant for a view-only user who can authenticate', () => {
			const tour = getWelcomeTour( {
				isViewOnly: true,
				canAuthenticate: true,
				isAnalyticsConnected: false,
				isActivateAnalyticsNotificationPresent: false,
				isKeyMetricsSetupCompleted: false,
				isAudienceSegmentationSetupCompleted: false,
			} );

			expect( tour.gaEventCategory( 'test-context' ) ).toBe(
				'test-context_dashboard-tour-sc'
			);
			expect( tour.slug ).toBe( 'welcome-without-analytics' );
			expect( tour.steps ).toEqual( [
				TRAFFIC_TRENDS_STEP,
				TOP_SEARCH_QUERIES_STEP,
				DASHBOARD_SHARING_VIEW_ONLY_AUTHENTICATED_STEP,
			] );
		} );

		it( 'should return the SC-only tour variant for a view-only user who cannot authenticate', () => {
			const tour = getWelcomeTour( {
				isViewOnly: true,
				canAuthenticate: false,
				isAnalyticsConnected: false,
				isActivateAnalyticsNotificationPresent: false,
				isKeyMetricsSetupCompleted: false,
				isAudienceSegmentationSetupCompleted: false,
			} );

			expect( tour.gaEventCategory( 'test-context' ) ).toBe(
				'test-context_dashboard-tour-sc'
			);
			expect( tour.slug ).toBe( 'welcome-without-analytics' );
			expect( tour.steps ).toEqual( [
				TRAFFIC_TRENDS_STEP,
				TOP_SEARCH_QUERIES_STEP,
				DASHBOARD_SHARING_VIEW_ONLY_UNAUTHENTICATED_STEP,
			] );
		} );

		it( 'should include the Activate Analytics step when the notification is present for authenticated users', () => {
			const tour = getWelcomeTour( {
				isViewOnly: false,
				canAuthenticate: true,
				isAnalyticsConnected: false,
				isActivateAnalyticsNotificationPresent: true,
				isKeyMetricsSetupCompleted: false,
				isAudienceSegmentationSetupCompleted: false,
			} );

			expect( tour.gaEventCategory( 'test-context' ) ).toBe(
				'test-context_dashboard-tour-sc'
			);
			expect( tour.slug ).toBe( 'welcome-without-analytics' );
			expect( tour.steps ).toEqual( [
				TRAFFIC_TRENDS_STEP,
				TOP_SEARCH_QUERIES_STEP,
				DASHBOARD_SHARING_STEP,
				ACTIVATE_ANALYTICS_STEP,
			] );
		} );

		it( 'should not include the Activate Analytics step for view-only users', () => {
			const tour = getWelcomeTour( {
				isViewOnly: true,
				canAuthenticate: true,
				isAnalyticsConnected: false,
				isActivateAnalyticsNotificationPresent: true,
				isKeyMetricsSetupCompleted: false,
				isAudienceSegmentationSetupCompleted: false,
			} );

			expect( tour.gaEventCategory( 'test-context' ) ).toBe(
				'test-context_dashboard-tour-sc'
			);
			expect( tour.slug ).toBe( 'welcome-without-analytics' );
			expect( tour.steps ).toEqual( [
				TRAFFIC_TRENDS_STEP,
				TOP_SEARCH_QUERIES_STEP,
				DASHBOARD_SHARING_VIEW_ONLY_AUTHENTICATED_STEP,
			] );
		} );
	} );
} );

/**
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

/*
 * Internal dependencies
 */
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';

function getDashboardSharingStep(
	isViewOnly: boolean,
	canAuthenticate: boolean
) {
	if ( isViewOnly ) {
		return {
			slug: 'dashboard-sharing',
			target: '.googlesitekit-header',
			floaterProps: {
				target: '.googlesitekit-view-only-menu',
			},
			title: __(
				'Get instant access to insights, no setup',
				'google-site-kit'
			),
			content: canAuthenticate
				? __(
						'See what’s been shared with you here, or sign in with Google to configure services and sharing access',
						'google-site-kit'
				  )
				: __(
						'Site admins have shared the dashboard with you, so you can keep track of how your site is doing. See what’s been shared with you here.',
						'google-site-kit'
				  ),
			offset: 0,
			spotlightPadding: 0,
			placement: 'bottom',
		};
	}

	return {
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
}

export function getWelcomeTour( {
	isViewOnly,
	canAuthenticate,
}: {
	isViewOnly: boolean;
	canAuthenticate: boolean;
} ) {
	return {
		slug: 'welcome-with-analytics',
		isRepeatable: true,
		contexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		gaEventCategory: ( viewContext: string ) =>
			`${ viewContext }_dashboard-tour-ga4`,
		steps: [
			{
				target: '.googlesitekit-widget-area--mainDashboardKeyMetricsPrimary',
				floaterProps: {
					target: '.googlesitekit-km-change-metrics-cta',
				},
				title: __(
					'Your goals, measured and clear',
					'google-site-kit'
				),
				content: __(
					"These Key Metrics show you exactly how your site is performing against the goals you set. Watch these numbers to see what's working and what's not.",
					'google-site-kit'
				),
				offset: -3,
				spotlightPadding: 4,
				placement: 'top-end',
			},
			{
				target: '.googlesitekit-widget--analyticsAllTrafficGA4',
				floaterProps: {
					target: '.googlesitekit-widget--analyticsAllTraffic__user-count-chart',
				},
				title: __(
					'Track traffic trends, identify baselines',
					'google-site-kit'
				),
				content: __(
					"Know what's normal for your site. This is how you spot trends and measure real growth.",
					'google-site-kit'
				),
				offset: 35,
				spotlightPadding: 0,
				placement: 'top',
			},
			{
				target: '.googlesitekit-widget-area--mainDashboardTrafficAudienceSegmentation',
				floaterProps: {
					target: '.googlesitekit-widget-audience-tiles__body .googlesitekit-widget--analyticsAudienceTiles:last-child .googlesitekit-audience-segmentation-tile__header-title',
				},
				title: __(
					'Get to know your site visitors',
					'google-site-kit'
				),
				content: __(
					'Not all visitors are the same, tailor your strategy based on who you want to attract',
					'google-site-kit'
				),
				offset: 14,
				spotlightPadding: 4,
				placement: 'top',
			},
			{
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
			},
			getDashboardSharingStep( isViewOnly, canAuthenticate ),
		],
	};
}

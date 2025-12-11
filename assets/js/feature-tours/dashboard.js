/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';

const dashboardTour = {
	slug: 'dashboard',
	isRepeatable: true,
	contexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
	gaEventCategory: ( viewContext ) => `${ viewContext }_dashboard`,
	steps: [
		{
			target: '.googlesitekit-widget--searchFunnelGA4',
			title: __(
				'Track Search traffic trends, identify baselines',
				'google-site-kit'
			),
			content: __(
				"Know what's normal for your site. This is how you spot trends and measure real growth.",
				'google-site-kit'
			),
			placement: 'top',
		},
		{
			target: '.googlesitekit-sharing-settings__button',
			title: __( 'Collaboration made easy', 'google-site-kit' ),
			content: __(
				'Share the dashboard with other stakeholders and manage their permissions with dashboard sharing feature.',
				'google-site-kit'
			),
			placement: 'bottom',
		},
	],
};

export default dashboardTour;

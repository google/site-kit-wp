/**
 * Unified Dashboard Feature Tour.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { VIEW_CONTEXT_DASHBOARD } from '../googlesitekit/constants';
import { isFeatureEnabled } from '../features';

const unifiedDashboard = {
	slug: 'unifiedDashboard',
	contexts: [ VIEW_CONTEXT_DASHBOARD ],
	version: '1.50.0',
	gaEventCategory: ( viewContext ) => `${ viewContext }_unified-dashboard`,
	checkRequirements: () => isFeatureEnabled( 'unifiedDashboard' ),
	steps: [
		{
			target: '.googlesitekit-navigation',
			title: __(
				'New! Navigate your dashboard easily with the dashboard tabs',
				'google-site-kit'
			),
			content: __(
				'Jump straight to the relevant section in your dashboard with just one click - no more scrolling.',
				'google-site-kit'
			),
			placement: 'bottom',
		},
		{
			target: '.googlesitekit-entity-search',
			title: __( 'Check stats for a specific post', 'google-site-kit' ),
			content: __(
				'Search by URL or by post title and your dashboard will be filtered to show stats just for that URL.',
				'google-site-kit'
			),
			placement: 'bottom',
		},
		{
			target: '.googlesitekit-widget--searchFunnel',
			title: __(
				'See trends over time for your site’s Search metrics',
				'google-site-kit'
			),
			content: __(
				'The updated Search Funnel shows you a more comprehensive view of how traffic from Search is changing.',
				'google-site-kit'
			),
			placement: 'top',
		},
	],
};

export default unifiedDashboard;

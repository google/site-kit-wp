/**
 * Dashboard Sharing Feature Tour.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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

const dashboardSharing = {
	slug: 'dashboardSharing',
	contexts: [ VIEW_CONTEXT_DASHBOARD ],
	// TODO: This version should be changed when the feature flag is removed
	// to the actual upcoming version.
	version: '1.85.0',
	gaEventCategory: ( viewContext ) => `${ viewContext }_dashboard-sharing`,
	steps: [
		{
			target: '.googlesitekit-sharing-settings__button',
			title: __( 'New! Dashboard sharing', 'google-site-kit' ),
			content: __(
				'Share a view-only version of your dashboard with other WordPress roles',
				'google-site-kit'
			),
			placement: 'bottom-start',
		},
	],
	checkRequirements: () => isFeatureEnabled( 'dashboardSharing' ),
};

export default dashboardSharing;

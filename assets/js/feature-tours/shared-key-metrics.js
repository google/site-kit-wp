/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
} from '../googlesitekit/constants';

const sharedKeyMetrics = {
	slug: 'sharedKeyMetrics',
	contexts: [
		VIEW_CONTEXT_MAIN_DASHBOARD,
		VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		VIEW_CONTEXT_ENTITY_DASHBOARD,
		VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
	],
	gaEventCategory: ( viewContext ) => `${ viewContext }_shared_key-metrics`,
	steps: [
		{
			target: '.googlesitekit-km-change-metrics-cta',
			title: __( 'Personalize your key metrics', 'google-site-kit' ),
			content: __(
				'Another admin has set up these tailored metrics for your site. Click here to personalize them.',
				'google-site-kit'
			),
			placement: 'bottom-start',
		},
	],
};

export default sharedKeyMetrics;

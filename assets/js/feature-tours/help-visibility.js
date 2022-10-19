/**
 * Contextual Help Feature Tour.
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
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
} from '../googlesitekit/constants';

const helpVisibility = {
	slug: 'helpVisibility',
	contexts: [
		VIEW_CONTEXT_MAIN_DASHBOARD,
		VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		VIEW_CONTEXT_ENTITY_DASHBOARD,
		VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
	],
	version: '1.29.0',
	gaEventCategory: ( viewContext ) => `${ viewContext }_headerbar_helpmenu`,
	steps: [
		{
			target: '.googlesitekit-help-menu',
			title: __( 'Need help?', 'google-site-kit' ),
			content: __(
				'Access the Site Kit docs or ask a question in our support forum from here.',
				'google-site-kit'
			),
			placement: 'bottom-start',
		},
	],
};

export default helpVisibility;

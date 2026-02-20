/**
 * WPDashboard component.
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
/* eslint camelcase:[0] */

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Root from './components/Root';
import {
	VIEW_CONTEXT_WP_DASHBOARD,
	VIEW_CONTEXT_WP_DASHBOARD_VIEW_ONLY,
} from './googlesitekit/constants';
import WPDashboardApp from './components/wp-dashboard/WPDashboardApp';

// Initialize the app once the DOM is ready.
domReady( () => {
	const renderTarget = document.getElementById(
		'js-googlesitekit-wp-dashboard'
	);

	if ( renderTarget ) {
		const { viewOnly } = renderTarget.dataset;
		const viewContext = viewOnly
			? VIEW_CONTEXT_WP_DASHBOARD_VIEW_ONLY
			: VIEW_CONTEXT_WP_DASHBOARD;

		const root = createRoot( renderTarget );

		root.render(
			<Root viewContext={ viewContext }>
				<WPDashboardApp />
			</Root>
		);
	}
} );

/**
 * Dashboard component.
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
import domReady from '@wordpress/dom-ready';
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { clearWebStorage } from './util';
import Root from './components/Root';
import './components/legacy-notifications';
import {
	VIEW_CONTEXT_DASHBOARD,
	VIEW_CONTEXT_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_MODULE_SETUP,
} from './googlesitekit/constants';
import DashboardEntryPoint from './components/DashboardEntryPoint';

// Initialize the app once the DOM is ready.
domReady( async () => {
	if ( global._googlesitekitLegacyData.admin.resetSession ) {
		clearWebStorage();
	}

	const renderTarget = document.getElementById(
		'js-googlesitekit-dashboard'
	);

	if ( renderTarget ) {
		// Make a separate API request since we cannot use selectors
		// outside the Root component.
		const { authenticated: isAuthenticated } = await API.get(
			'core',
			'user',
			'authentication',
			{},
			{ useCache: false }
		);

		const { setupModuleSlug } = renderTarget.dataset;
		let viewContext = VIEW_CONTEXT_MODULE_SETUP;
		if ( ! setupModuleSlug ) {
			viewContext = isAuthenticated
				? VIEW_CONTEXT_DASHBOARD
				: VIEW_CONTEXT_DASHBOARD_VIEW_ONLY;
		}
		render(
			<Root viewContext={ viewContext }>
				<DashboardEntryPoint setupModuleSlug={ setupModuleSlug } />
			</Root>,
			renderTarget
		);
	}
} );

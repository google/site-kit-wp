/**
 * DashboardDetails component.
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
 * Internal dependencies.
 */
import DashboardEntityApp from './components/DashboardEntityApp';
import Root from './components/Root';
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
} from './googlesitekit/constants';

// Initialize the app once the DOM is ready.
domReady( () => {
	const renderTarget = document.getElementById(
		'js-googlesitekit-entity-dashboard'
	);

	if ( renderTarget ) {
		const { viewOnly } = renderTarget.dataset;

		render(
			<Root
				viewContext={
					viewOnly
						? VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY
						: VIEW_CONTEXT_ENTITY_DASHBOARD
				}
			>
				<DashboardEntityApp />
			</Root>,
			renderTarget
		);
	}
} );

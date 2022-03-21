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
import './components/legacy-notifications';
import { useFeature } from './hooks/useFeature';
import DashboardDetailsApp from './components/dashboard-details/DashboardDetailsApp';
import DashboardEntityApp from './components/DashboardEntityApp';
import Root from './components/Root';
import {
	VIEW_CONTEXT_PAGE_DASHBOARD,
	VIEW_CONTEXT_PAGE_DASHBOARD_VIEW_ONLY,
} from './googlesitekit/constants';

const GoogleSitekitDashboardDetails = () => {
	const unifiedDashboardEnabled = useFeature( 'unifiedDashboard' );

	if ( unifiedDashboardEnabled ) {
		return <DashboardEntityApp />;
	}
	return <DashboardDetailsApp />;
};

// Initialize the app once the DOM is ready.
domReady( () => {
	const renderTarget = document.getElementById(
		'js-googlesitekit-dashboard-details'
	);

	if ( renderTarget ) {
		// Using global preloaded data since we cannot use selectors
		// outside the Root component.
		const isAuthenticated =
			global._googlesitekitAPIFetchData.preloadedData[
				'/google-site-kit/v1/core/user/data/authentication'
			].body.authenticated;

		render(
			<Root
				viewContext={
					isAuthenticated
						? VIEW_CONTEXT_PAGE_DASHBOARD
						: VIEW_CONTEXT_PAGE_DASHBOARD_VIEW_ONLY
				}
			>
				<GoogleSitekitDashboardDetails />
			</Root>,
			renderTarget
		);
	}
} );

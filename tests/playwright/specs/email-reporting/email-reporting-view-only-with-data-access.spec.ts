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
 * Internal dependencies
 */
import { expect, test } from '../../playwright';
import {
	asUser,
	withConnectedModules,
	withPlugins,
	withSharedModules,
} from '../../wordpress';
import { EmailReportingPage } from './email-reporting-page';

// Runs as a non-authenticated editor with only site-level proxy credentials (no
// `proxy-auth.php`), so the dashboard is view-only. Search Console is connected
// (owned by the admin, ID 1) and shared with the editor role, which is one of the
// two modules email reports draw data from. The editor has the shared-dashboard
// splash pre-dismissed so it lands on the view-only dashboard directly.
test.describe(
	'Email Reporting (view-only with data access)',
	{
		annotation: [
			asUser( 'editor', {
				dismissedItems: [ 'shared_dashboard_splash' ],
			} ),
			withPlugins( 'proxy-credentials.php' ),
			withConnectedModules( {
				slug: 'search-console',
				settings: {
					propertyID: 'http://localhost:9002',
					ownerID: 1,
				},
			} ),
			withSharedModules( {
				'search-console': {
					sharedRoles: [ 'editor' ],
					management: 'owner',
				},
			} ),
		],
	},
	() => {
		test( 'should open the panel from the header', async ( { wp } ) => {
			await wp.visitDashboard();

			const pageObject = new EmailReportingPage( wp.page );

			await pageObject.openSettings();
			await expect( pageObject.panelTitle ).toBeVisible();
		} );

		test( 'should no longer offer the view-only menu item', async ( {
			wp,
		} ) => {
			await wp.visitDashboard();

			await wp.page.getByRole( 'button', { name: 'View only' } ).click();

			await expect(
				wp.page
					.locator( '#view-only-menu' )
					.getByText( 'Manage email reports' )
			).toBeHidden();
		} );
	}
);

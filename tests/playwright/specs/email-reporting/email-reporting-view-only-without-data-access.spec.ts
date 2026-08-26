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

// The same view-only setup as the with-data-access spec, but only PageSpeed
// Insights is shared. It is shareable yet is not a module email reports draw
// data from, so the editor reaches the view-only dashboard without email
// reporting data access. Search Console still has to be connected because Site
// Kit is not set up without it, but leaving it unshared keeps it out of the
// editor's viewable modules.
test.describe(
	'Email Reporting (view-only without data access)',
	{
		annotation: [
			asUser( 'editor', {
				dismissedItems: [ 'shared_dashboard_splash' ],
			} ),
			withPlugins( 'proxy-credentials.php' ),
			withConnectedModules(
				{
					slug: 'search-console',
					settings: {
						propertyID: 'http://localhost:9002',
						ownerID: 1,
					},
				},
				{ slug: 'pagespeed-insights', settings: { ownerID: 1 } }
			),
			withSharedModules( {
				'pagespeed-insights': {
					sharedRoles: [ 'editor' ],
					management: 'owner',
				},
			} ),
		],
	},
	() => {
		test( 'should not offer the header entry point', async ( { wp } ) => {
			await wp.visitDashboard();

			const pageObject = new EmailReportingPage( wp.page );

			// The view-only menu proves this user reached the view-only dashboard,
			// so a missing icon means they lack access to the data email reports
			// draw on, not that the page failed to load.
			await expect(
				wp.page.getByRole( 'button', { name: 'View only' } )
			).toBeVisible();
			await expect( pageObject.manageEmailReportsButton ).toBeHidden();
			// Without sharing, PDF download, or email reports access there is
			// nothing for the features menu to offer, so it is hidden too.
			await expect( pageObject.featuresMenuButton ).toBeHidden();
		} );
	}
);

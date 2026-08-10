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
	withFeatureFlags,
	withFixtures,
	withPlugins,
	withSharedModules,
} from '../../wordpress';
import {
	EmailReportingPage,
	VerifyPanelStateOptions,
} from './email-reporting-page';

const user = asUser( 'admin' );
const plugins = withPlugins( 'proxy-auth.php', 'email-reporting.php' );

test.describe( 'Email Reporting', { annotation: [ user, plugins ] }, () => {
	test(
		'should deliver a weekly email report',
		{
			annotation: [
				withFixtures( 'email-reporting/weekly-report-data' ),
			],
		},
		async ( { wp } ) => {
			// Go to the Site Kit dashboard page.
			await wp.visitDashboard();

			// Quickly open the email reporting settings panel and select the weekly subscription.
			await test.step( 'Subscribe to weekly reports', async () => {
				const pageObject = new EmailReportingPage( wp.page );
				await pageObject.openSettings();
				await pageObject.subscribe();
				await pageObject.verifySubscriptionSuccess();
			} );

			// Trigger the email pipeline to send the weekly report.
			await wp.step( 'Trigger email pipeline', async () => {
				const response = await wp.restRequest(
					'POST',
					'google-site-kit/v1/e2e/email-reporting/trigger-cron',
					{
						body: JSON.stringify( { frequency: 'weekly' } ),
						headers: { 'Content-Type': 'application/json' },
					}
				);

				await expect( response ).toEqual( { success: true } );
			} );

			// Verify the email was sent and has the correct content.
			await wp.step( 'Verify email', async () => {
				const message = await wp.mailpit.waitForMessage();
				expect( message.Subject ).toContain(
					'Your weekly Site Kit report'
				);

				const detail = await wp.mailpit.getMessage( message.ID );
				await wp.page.setContent( detail.HTML );
				await expect( wp.page ).toHaveScreenshot( {
					fullPage: true,
				} );
			} );
		}
	);

	test( 'should let user select a subscription', async ( { wp } ) => {
		// Go to the Site Kit dashboard page.
		await wp.visitDashboard();

		const pageObject = new EmailReportingPage( wp.page );

		// Define panel state options for initial state.
		const initialPanelState: VerifyPanelStateOptions = {
			expectedCheckedFrequency: 'Weekly',
			shouldShowSubscribeButton: true,
		};

		// Define panel state options for subscribed state.
		const subscribedPanelState: VerifyPanelStateOptions = {
			shouldShowCurrentSubscription: true,
			expectedCheckedFrequency: 'Monthly',
			shouldShowUnsubscribeButton: true,
			shouldShowUpdateButton: true,
		};

		// Open the email reporting settings panel.
		await wp.step( 'Open settings page', async () => {
			await pageObject.openSettings();
		} );

		// Verify the settings panel state.
		await wp.step( 'Verify settings panel state', async () => {
			await pageObject.verifyPanelState( initialPanelState );
		} );

		// Verify the monthly option can be selected.
		await wp.step( 'Set monthly option', async () => {
			await pageObject.selectFrequency( 'Monthly' );
			await pageObject.subscribe();
			await pageObject.verifySubscriptionSuccess();
		} );

		// Verify the settings panel state changed.
		await wp.step( 'Verify settings state changed', async () => {
			await pageObject.verifyPanelState( subscribedPanelState );
		} );
	} );

	test( 'should open the panel from the header, not the user menu', async ( {
		wp,
	} ) => {
		await wp.visitDashboard();

		const pageObject = new EmailReportingPage( wp.page );

		await pageObject.openSettings();
		await expect( pageObject.panelTitle ).toBeVisible();

		await wp.page.keyboard.press( 'Escape' );

		// The entry point used to live in the user menu.
		await wp.page.getByRole( 'button', { name: 'Account' } ).click();
		await expect(
			wp.page.getByRole( 'menuitem', { name: 'Manage email reports' } )
		).toBeHidden();
	} );

	test(
		'should not offer the header entry point during the initial setup flow',
		{ annotation: [ withFeatureFlags( 'setupFlowRefresh' ) ] },
		async ( { wp } ) => {
			await wp.visitAdmin(
				'admin.php?page=googlesitekit-dashboard&showProgress=true'
			);

			const pageObject = new EmailReportingPage( wp.page );

			// Checked instead of a Site Kit-rendered control: WordPress renders the
			// admin toolbar itself, outside the Site Kit app's React tree, so it
			// proves the page loaded even if an unrelated error inside that tree
			// (e.g. one thrown by a different header control) replaced the app with
			// its error fallback and took every Site Kit element down with it.
			await expect( wp.page.locator( '#wpadminbar' ) ).toBeVisible();
			await expect( pageObject.manageEmailReportsButton ).toBeHidden();

			// The features menu still renders for its other items, so prove
			// the email reports item is the one missing.
			if ( await pageObject.featuresMenuButton.isVisible() ) {
				await pageObject.featuresMenuButton.click();
				await expect(
					pageObject.manageEmailReportsMenuItem
				).toBeHidden();
			}
		}
	);
} );

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

// The same view-only setup, but only PageSpeed Insights is shared. It is
// shareable yet is not a module email reports draw data from, so the editor
// reaches the view-only dashboard without email reporting data access. Search
// Console still has to be connected because Site Kit is not set up without it,
// but leaving it unshared keeps it out of the editor's viewable modules.
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

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
import { test, expect } from '../../playwright';
import {
	asUser,
	withPlugins,
	withFeatureFlags,
	withFixtures,
} from '../../wordpress';

test.describe(
	'Email Reporting',
	{
		annotation: [
			asUser( 'admin' ),
			withPlugins( 'proxy-auth.php' ),
			withFeatureFlags( 'proactiveUserEngagement' ),
		],
	},
	() => {
		test(
			'should deliver a weekly email report',
			{
				annotation: [
					withPlugins( 'mailpit.php', 'email-reporting.php' ),
					withFixtures( 'email-reporting/weekly-report-data' ),
				],
			},
			async ( { wp } ) => {
				// Go to the Site Kit dashboard page.
				await wp.visitDashboard();

				// Quickly open the email reporting settings panel and select the weekly subscription.
				await test.step( 'Subscribe to weekly reports', async () => {
					await wp.page
						.getByRole( 'button', { name: 'Account' } )
						.click();
					await wp.page
						.getByRole( 'menuitem', {
							name: 'Manage email reports',
						} )
						.click();

					const root = wp.page.locator(
						'.googlesitekit-email-reporting-settings'
					);
					await root
						.getByRole( 'button', { name: 'Subscribe' } )
						.click();
					await expect(
						root
							.getByRole( 'status' )
							.filter( { hasText: 'successfully subscribed' } )
					).toBeVisible( { timeout: 10_000 } );
				} );

				// Trigger the email pipeline to send the weekly report.
				await test.step( 'Trigger email pipeline', async () => {
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
				await test.step( 'Verify email', async () => {
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

			// Open the email reporting settings panel.
			await test.step( 'Open settings page', async () => {
				const itemName = 'Manage email reports';
				await wp.page
					.getByRole( 'button', { name: 'Account' } )
					.click();
				await wp.page
					.getByRole( 'menuitem', { name: itemName } )
					.click();
			} );

			// Get the root element of the Email Reporting settings panel.
			const root = wp.page.locator(
				'.googlesitekit-email-reporting-settings'
			);

			const panelTitle = root.getByRole( 'heading', {
				name: 'Email reports subscription',
			} );

			const currentSubscription = root.locator(
				'.googlesitekit-frequency-selector__current-subscription'
			);

			const weekly = root.getByRole( 'radio', { name: 'Weekly' } );
			const monthly = root.getByRole( 'radio', { name: 'Monthly' } );
			const quarterly = root.getByRole( 'radio', {
				name: 'Quarterly',
			} );

			// Verify the settings panel state.
			await test.step( 'Verify settings panel state', async () => {
				// The panel title is visible.
				await expect( panelTitle ).toBeVisible();

				// The current subscription badge is not visible.
				await expect( currentSubscription ).not.toBeVisible();

				// Frequency options are visible.
				await expect( weekly ).toBeVisible();
				await expect( monthly ).toBeVisible();
				await expect( quarterly ).toBeVisible();

				// Weekly option is checked by default.
				await expect( weekly ).toBeChecked();
			} );

			// Verify the monthly option can be selected.
			await test.step( 'Set monthly option', async () => {
				await monthly.click();
				await expect( weekly ).not.toBeChecked();
				await expect( monthly ).toBeChecked();

				await root.getByRole( 'button', { name: 'Subscribe' } ).click();

				const notice = root
					.getByRole( 'status' )
					.filter( { hasText: 'successfully subscribed' } );
				await expect( notice ).toBeVisible( { timeout: 10_000 } );
			} );

			// Verify the settings panel state changed.
			await test.step( 'Verify settings state changed', async () => {
				const unsubscribe = root.getByRole( 'button', {
					name: 'Unsubscribe',
				} );
				const update = root.getByRole( 'button', {
					name: 'Update settings',
				} );

				await expect( currentSubscription ).toBeVisible();
				await expect( weekly ).not.toBeChecked();
				await expect( monthly ).toBeChecked();
				await expect( unsubscribe ).toBeVisible();
				await expect( update ).toBeVisible();
			} );
		} );
	}
);

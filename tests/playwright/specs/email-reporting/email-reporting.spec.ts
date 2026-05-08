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
import { asUser, withPlugins, withFixtures } from '../../wordpress';
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
} );

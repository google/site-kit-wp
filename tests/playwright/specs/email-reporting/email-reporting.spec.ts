/**
 * Plugin activation tests.
 *
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
import { test, expect, TestDetails } from '../../playwright';
import { asUser, withPlugins, withFeatureFlags } from '../../wordpress';

const details: TestDetails = {
	annotation: [
		asUser( 'admin' ),
		withPlugins( 'proxy-auth.php' ),
		withFeatureFlags( 'proactiveUserEngagement' ),
	],
};

test.describe( 'email reporting', details, () => {
	test( 'should let user to select a subscription', async ( { wp } ) => {
		// Go to the Site Kit dashboard page.
		await wp.visitDashboard();

		// Open the email reporting settings panel.
		await test.step( 'Open settings page', async () => {
			const itemName = 'Manage email reports';
			await wp.page.getByRole( 'button', { name: 'Account' } ).click();
			await wp.page.getByRole( 'menuitem', { name: itemName } ).click();
		} );

		const frequency = wp.page.getByRole( 'heading', { name: 'Frequency' } );
		const weekly = wp.page.getByRole( 'radio', { name: 'Weekly' } );
		const monthly = wp.page.getByRole( 'radio', { name: 'Monthly' } );
		const quarterly = wp.page.getByRole( 'radio', { name: 'Quarterly' } );

		// Verify the settings panel state.
		await test.step( 'Verify settings panel state', async () => {
			// The frequency heading is visible.
			await expect( frequency ).toBeVisible();

			// The current subscription badge is not visible.
			const currentSubscription = wp.page.locator(
				'.googlesitekit-frequency-selector__current-subscription'
			);
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

			await wp.page.getByRole( 'button', { name: 'Subscribe' } ).click();

			const notice = wp.page.getByRole( 'alert', {
				name: 'successfully subscribed',
			} );
			await expect( notice ).toBeVisible();
		} );
	} );
} );

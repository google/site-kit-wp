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
	test( 'should add menu item to manage subscriptions', async ( { wp } ) => {
		await wp.visitDashboard();

		const userMenu = wp.page.getByRole( 'button', { name: 'Account' } );
		await expect( userMenu ).toBeVisible();
		await userMenu.click();

		const menuItem = wp.page.getByRole( 'menuitem', {
			name: 'Manage email reports',
		} );
		await expect( menuItem ).toBeVisible();
	} );
} );

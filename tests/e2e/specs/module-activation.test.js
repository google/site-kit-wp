/**
 * Module Activation tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { deactivateUtilityPlugins, resetSiteKit, setupSiteKit } from '../utils';

describe( 'Module activation', () => {
	beforeEach( async () => {
		await setupSiteKit();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'should prevent non active modules to be set up', async () => {
		await visitAdminPage(
			'admin.php',
			'page=googlesitekit-dashboard&slug=analytics-4&reAuth=true'
		);
		await page.waitForSelector( '.googlesitekit-plugin' );
		await expect( page ).toMatchElement( '.googlesitekit-notice', {
			text: /The Analytics module cannot be set up as it has not been activated yet./i,
		} );
	} );

	it( 'should render an error message when an invalid module slug is used to setup the module', async () => {
		await visitAdminPage(
			'admin.php',
			'page=googlesitekit-dashboard&slug=foo&reAuth=true'
		);
		await page.waitForSelector( '.googlesitekit-plugin' );
		await expect( page ).toMatchElement( '.googlesitekit-notice', {
			text: /Invalid module slug foo./i,
		} );
	} );
} );

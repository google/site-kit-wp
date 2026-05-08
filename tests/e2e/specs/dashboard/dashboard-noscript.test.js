/**
 * Dashboard noscript tests.
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
import { visitAdminPage } from '@wordpress/e2e-test-utils';
import { createWaitForFetchRequests } from '../../utils';

describe( 'dashboard noscript notice', () => {
	let waitForFetchRequests;
	beforeEach( async () => {
		waitForFetchRequests = createWaitForFetchRequests();
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
	} );

	afterEach( () => waitForFetchRequests() ); // Clean up request listeners.

	describe( 'with Javascript enabled', () => {
		it( 'Should not display noscript notice', async () => {
			await expect( page ).not.toMatchElement(
				'.googlesitekit-noscript'
			);
			await waitForFetchRequests(); // Wait for compatibility checks to finish.
		} );
	} );

	describe( 'with Javascript disabled', () => {
		beforeAll( async () => {
			await page.setJavaScriptEnabled( false );
		} );

		afterAll( async () => {
			await page.setJavaScriptEnabled( true );
		} );

		it( 'should not display plugin html', async () => {
			await expect( page ).toMatchElement( '[id^=js-googlesitekit-]', {
				visible: false,
			} );
			await expect( page ).not.toMatchElement( '.googlesitekit-header' );
			await expect( page ).not.toMatchElement(
				'.googlesitekit-module-page'
			);
		} );

		it( 'should display noscript notice', async () => {
			await expect( page ).toMatchElement(
				'.googlesitekit-noscript__text',
				{
					text: /The Site Kit by Google plugin requires JavaScript to be enabled in your browser/i,
				},
				{ visible: true }
			);
		} );
	} );
} );

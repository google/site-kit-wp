/**
 * e2e tests for Publisher Win notifications.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { setupSiteKit, setSitePosts } from '../../utils';

describe( 'publisher win notifications', () => {
	beforeEach( async () => {
		await setupSiteKit();
	} );

	afterAll( () => {} );

	describe( 'with Site Kit active and authenticated', () => {
		it.only( 'displays the notification for 1 post', async () => {
			await setSitePosts( 1 );
			await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );
			await page.waitForSelector( '.googlesitekit-activation__title' );
			await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on your first post!/i } );
		} );
		it( 'displays the notification for 5 posts', async () => {} );
		it( 'displays the notification for more than 5 posts', async () => {} );
	} );

	describe( 'with Analytics module active', () => {
		it( 'shows notification for page view increase', () => {} );
		it( 'shows notification for unique visitor increase', () => {} );
	} );
} );

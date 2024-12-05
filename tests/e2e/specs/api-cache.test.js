/**
 * API caching functions tests.
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
import {
	pageWait,
	resetSiteKit,
	safeLoginUser,
	setupSiteKit,
	testSiteNotification,
	useRequestInterception,
	wpApiFetch,
} from '../utils';
import { deleteAuthCookie } from '../utils/delete-auth-cookie';

const goToSiteKitDashboard = async () => {
	await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );
};

describe( 'API cache', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			const url = request.url();
			if ( url.match( 'search-console/data/searchanalytics' ) ) {
				request.respond( { status: 200, body: '[]' } );
			} else if ( url.match( 'pagespeed-insights/data/pagespeed' ) ) {
				request.respond( { status: 200, body: '{}' } );
			} else if ( url.match( 'user/data/survey' ) ) {
				request.respond( { status: 200, body: '{"survey":null}' } );
			} else if ( url.match( 'user/data/survey-timeouts' ) ) {
				request.respond( { status: 200, body: '[]' } );
			} else {
				request.continue();
			}
		} );

		await setupSiteKit();
	} );

	afterAll( async () => {
		await resetSiteKit();
	} );

	it( 'isolates client storage between sessions', async () => {
		const firstTestNotification = { ...testSiteNotification };
		const secondTestNotification = {
			...testSiteNotification,
			id: 'test-notification-2',
			title: 'Test notification title 2',
			dismissLabel: 'test dismiss site notification 2',
		};

		// create first notification
		await wpApiFetch( {
			path: 'google-site-kit/v1/e2e/core/site/notifications',
			method: 'post',
			data: firstTestNotification,
		} );

		await goToSiteKitDashboard();

		await pageWait();

		await page.waitForSelector(
			`#${ firstTestNotification.id }.googlesitekit-publisher-win--is-open`,
			{ timeout: 10_000 } // Core site notifications are delayed 5s for surveys.
		);

		await expect( page ).toClick(
			'.googlesitekit-publisher-win .mdc-button span',
			{
				text: firstTestNotification.dismissLabel,
			}
		);

		// create second notification
		await wpApiFetch( {
			path: 'google-site-kit/v1/e2e/core/site/notifications',
			method: 'post',
			data: secondTestNotification,
		} );

		// delete auth cookie to sign out the current user
		await deleteAuthCookie();

		await safeLoginUser( 'admin', 'password' );

		await goToSiteKitDashboard();

		await pageWait();

		// Ensure the second notification is displayed.
		await page.waitForSelector(
			`#${ secondTestNotification.id }.googlesitekit-publisher-win--is-open`,
			{ timeout: 10_000 } // Core site notifications are delayed 5s for surveys.
		);

		await expect( page ).toMatchElement(
			'.googlesitekit-publisher-win__title',
			{
				text: secondTestNotification.title,
			}
		);
	} );
} );

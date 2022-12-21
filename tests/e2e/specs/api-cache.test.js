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
import {
	activatePlugin,
	deactivatePlugin,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	safeLoginUser,
	setSearchConsoleProperty,
	setSiteVerification,
	testSiteNotification,
	useRequestInterception,
	wpApiFetch,
} from '../utils';

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
			} else if ( url.match( 'user/data/survey-timeouts' ) ) {
				request.respond( { status: 200, body: '[]' } );
			} else {
				request.continue();
			}
		} );

		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'e2e-tests-proxy-auth-plugin' );
	} );

	it( 'isolates client storage between users', async () => {
		const firstTestNotification = { ...testSiteNotification };
		const secondTestNotification = {
			...testSiteNotification,
			id: 'test-notification-2',
			title: 'Test notification title 2',
			dismissLabel: 'test dismiss site notification 2',
		};

		// create dummy first notification
		await wpApiFetch( {
			path: 'google-site-kit/v1/e2e/core/site/notifications',
			method: 'post',
			data: firstTestNotification,
		} );

		await goToSiteKitDashboard();

		await page.waitForSelector(
			`#${ firstTestNotification.id }.googlesitekit-publisher-win--is-open`
		);

		await expect( page ).toClick(
			'.googlesitekit-publisher-win .mdc-button span',
			{
				text: firstTestNotification.dismissLabel,
			}
		);

		// create dummy second notification
		await wpApiFetch( {
			path: 'google-site-kit/v1/e2e/core/site/notifications',
			method: 'post',
			data: secondTestNotification,
		} );

		// delete all cookies
		await page._client.send( 'Network.clearBrowserCookies' );

		await safeLoginUser( 'admin', 'password' );

		await goToSiteKitDashboard();

		// Ensure the second notification is displayed.
		await page.waitForSelector(
			`#${ secondTestNotification.id }.googlesitekit-publisher-win--is-open`
		);

		await expect( page ).toMatchElement(
			'.googlesitekit-publisher-win__title',
			{
				text: secondTestNotification.title,
			}
		);
	} );
} );

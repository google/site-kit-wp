/**
 * Tests for Analytics module setup via proxy with no account and no existing tag.
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
import {
	activatePlugin,
	createURL,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	resetSiteKit,
	useRequestInterception,
	setSearchConsoleProperty,
} from '../../../utils';

describe( 'setting up the Analytics module with no existing account and no existing tag via proxy', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if (
				request
					.url()
					.startsWith(
						'https://sitekit.withgoogle.com/o/oauth2/auth'
					)
			) {
				request.respond(
					{
						status: 302,
						headers: {
							location: createURL(
								'/wp-admin/index.php',
								[
									'oauth2callback=1',
									'code=valid-test-code',
									// This is how the additional scope is granted.
									'scope=https://www.googleapis.com/auth/analytics.provision https://www.googleapis.com/auth/analytics.edit',
								].join( '&' )
							),
						},
					},
					10
				);
			} else if (
				request.url().match( 'analytics/data/create-account-ticket' )
			) {
				request.respond( { status: 200 }, 10 ); // Do nothing for now, return 200 to prevent error.
			} else if (
				request.url().match( 'analytics-4/data/account-summaries' )
			) {
				request.respond(
					{
						status: 200,
						body: JSON.stringify( {} ),
					},
					10
				);
			} else {
				request.continue( {}, 5 );
			}
		} );
	} );

	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await activatePlugin( 'e2e-tests-site-verification-plugin' );
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await activatePlugin(
			'e2e-tests-module-setup-analytics-api-mock-no-account'
		);
		await setSearchConsoleProperty();

		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar' );
		await expect( page ).toClick( '.mdc-tab', {
			text: /connect more services/i,
		} );
		await page.waitForSelector(
			'.googlesitekit-settings-connect-module--analytics'
		);
		await expect( page ).toClick( '.googlesitekit-cta-link', {
			text: /set up analytics/i,
		} );
		await page.waitForSelector( '.googlesitekit-setup-module--analytics' );
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'displays account creation form when user has no Analytics account', async () => {
		await expect( page ).toMatchElement( '.googlesitekit-heading-4', {
			text: /Create your Analytics account/i,
			timeout: 5000,
		} );
		await expect( page ).toMatchElement( '.mdc-button', {
			text: /create account/i,
		} );
	} );

	it( 'preserves user-filled values provided and auto-submits after approving permissions', async () => {
		await page.waitForSelector( '.googlesitekit-heading-4' );

		// Unfortunately, the view does not have a `form`, otherwise we could use `.toFillForm( el, fields )`
		await expect( page ).toFill(
			'#googlesitekit_analytics_account_create_account',
			'Test Account Name'
		);
		await expect( page ).toFill(
			'#googlesitekit_analytics_account_create_property',
			'Test Property Name'
		);
		await expect( page ).toFill(
			'#googlesitekit_analytics_account_create_profile',
			'Test View Name'
		);

		await expect( page ).toClick(
			'.googlesitekit-analytics__select-country'
		);
		await expect( page ).toClick( '.mdc-menu-surface--open li', {
			text: /united kingdom/i,
		} );

		await expect( page ).toMatchElement( 'p', {
			text: /need to give Site Kit permission to create an Analytics account/i,
		} );

		await expect( page ).toMatchElement(
			'.googlesitekit-settings-notice__text',
			{
				text: /create both a Google Analytics 4 and Universal Analytics/i,
			}
		);

		await Promise.all( [
			expect( page ).toClick( '.mdc-button', {
				text: /create account/i,
			} ),
		] );

		// When returning from OAuth, the form will resubmit automatically, so we won't be able to see the form to verify the values there.
		// Instead, we can ensure that they were passed in the request to `create-account-ticket`
		// Everything else is difficult to mock out here.

		let reqBody;
		await page.waitForRequest(
			( req ) =>
				req.url().match( 'analytics/data/create-account-ticket' ) &&
				( reqBody = req.postData() )
		);
		expect( JSON.parse( reqBody ) ).toMatchObject( {
			data: {
				accountName: 'Test Account Name',
				propertyName: 'Test Property Name',
				profileName: 'Test View Name',
				timezone: 'Etc/GMT',
			},
		} );
	} );
} );

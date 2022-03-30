/**
 * Analytics write scope requests tests.
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
	setupSiteKit,
} from '../../../utils';
import * as fixtures4 from '../../../../../assets/js/modules/analytics-4/datastore/__fixtures__';
import * as fixtures from '../../../../../assets/js/modules/analytics/datastore/__fixtures__';

describe( 'Analytics write scope requests', () => {
	let scope;
	// These variables are used to determine whether or not we need to intercept requests to the server. By default the first request
	// won't be intercepted to reach the server and to trigger the insufficient scopes error on the server. The following requests will
	// be intercepted and mocked to immediately return fake data to emulate property/profile creation.
	let interceptCreatePropertyRequest;
	let interceptCreateProfileRequest;

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
				request.respond( {
					status: 302,
					headers: {
						location: createURL(
							'/wp-admin/index.php',
							`oauth2callback=1&code=valid-test-code&scope=${ scope }`
						),
					},
				} );
			} else if (
				request.url().match( 'analytics/data/create-account-ticket' )
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify( {
						id: `${ Math.ceil( 1000 * Math.random() ) }`,
					} ),
				} );
			} else if (
				request
					.url()
					.match(
						'/wp-json/google-site-kit/v1/modules/analytics/data/report?'
					)
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify( [] ),
				} );
			} else if (
				request.url().match( 'analytics/data/create-property' )
			) {
				if ( interceptCreatePropertyRequest ) {
					request.respond( {
						status: 200,
						body: JSON.stringify( fixtures.createProperty ),
					} );
				} else {
					request.continue();
					interceptCreatePropertyRequest = true;
				}
			} else if (
				request.url().match( 'analytics/data/create-profile' )
			) {
				if ( interceptCreateProfileRequest ) {
					request.respond( {
						status: 200,
						body: JSON.stringify( fixtures.createProfile ),
					} );
				} else {
					request.continue();
					interceptCreateProfileRequest = true;
				}
			} else if (
				request.url().match( 'analytics-4/data/create-property' )
			) {
				request.respond( {
					body: JSON.stringify( fixtures4.createProperty ),
					status: 200,
				} );
			} else if (
				request.url().match( 'analytics-4/data/account-summaries' )
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify( {} ),
				} );
			} else if (
				request.url().match( 'analytics-4/data/create-webdatastream' )
			) {
				request.respond( {
					body: JSON.stringify( fixtures4.createWebDataStream ),
					status: 200,
				} );
			} else if (
				request.url().match( '//analytics.google.com/analytics/web/' )
			) {
				request.respond( { status: 200 } );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		scope =
			'https://www.googleapis.com/auth/analytics.provision https://www.googleapis.com/auth/analytics.edit';
		interceptCreatePropertyRequest = false;
		interceptCreateProfileRequest = false;

		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await setupSiteKit();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'prompts for additional permissions during a new Analytics account creation if the user has not granted the Analytics provisioning scope', async () => {
		await activatePlugin(
			'e2e-tests-module-setup-analytics-api-mock-no-account'
		);

		// Go to the analytics setup page.
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
		await page.waitForSelector( '.googlesitekit-setup-module__inputs' );

		// The user sees a notice above the button that explains they will need to grant additional permissions.
		await expect( page ).toMatchElement( 'p', {
			text: /You will need to give Site Kit permission to create an Analytics account/i,
		} );

		// Upon clicking the button, they're redirected to OAuth (should be mocked).
		await Promise.all( [
			expect( page ).toClick( '.mdc-button', {
				text: /create account/i,
			} ),
		] );

		// When returning, their original action is automatically invoked, without requiring them to click the button again.
		await page.waitForRequest( ( req ) =>
			req.url().match( 'analytics/data/create-account-ticket' )
		);

		// They should be redirected to the Analytics TOS.
		await page.waitForRequest( ( req ) =>
			req.url().match( 'analytics.google.com/analytics/web' )
		);
	} );

	it( 'prompts for additional permissions during a new Analytics property creation if the user has not granted the Analytics edit scope', async () => {
		scope = 'https://www.googleapis.com/auth/analytics.edit';
		interceptCreateProfileRequest = true;

		await activatePlugin( 'e2e-tests-module-setup-analytics-api-mock' );

		// Go to the analytics setup page.
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
		await page.waitForSelector( '.googlesitekit-setup-module__inputs' );

		// Select "Set up a new property" option.
		await expect( page ).toClick(
			'.googlesitekit-analytics__select-property'
		);
		await expect( page ).toClick( '.mdc-menu-surface--open li', {
			text: /set up a new property/i,
		} );

		// Click on confirm changes button and wait for permissions modal dialog.
		await expect( page ).toClick( '.mdc-button--raised', {
			text: /configure analytics/i,
		} );
		await page.waitForSelector( '.mdc-dialog--open .mdc-button', {
			timeout: 3000,
		} );
		await expect( page ).toClick( '.mdc-dialog--open .mdc-button', {
			text: /proceed/i,
		} );
		expect( console ).toHaveErrored(); // Permission scope error.
		await page.waitForRequest( ( req ) =>
			req.url().match( 'analytics/data/create-property' )
		);
		await page.waitForRequest( ( req ) =>
			req.url().match( 'analytics/data/create-profile' )
		);
		await page.waitForRequest( ( req ) =>
			req.url().match( 'analytics-4/data/create-property' )
		);

		// They should end up on the dashboard.
		await Promise.all( [
			page.waitForNavigation(),
			page.waitForSelector( '.googlesitekit-publisher-win__title' ),
		] );

		await expect( page ).toMatchElement(
			'.googlesitekit-publisher-win__title',
			{
				text: /Congrats on completing the setup for Analytics!/i,
			}
		);

		expect( console ).toHaveErrored(); // Permission scope error.
	} );

	it( 'prompts for additional permissions during a new Analytics profile creation if the user has not granted the Analytics edit scope', async () => {
		await activatePlugin( 'e2e-tests-module-setup-analytics-api-mock' );

		// Go to the analytics setup page.
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
		await page.waitForSelector( '.googlesitekit-setup-module__inputs' );

		// Select "Test Account A" account.
		await expect( page ).toClick(
			'.googlesitekit-analytics__select-account'
		);
		await expect( page ).toClick( '.mdc-menu-surface--open li', {
			text: /test account a/i,
		} );

		// Select "Test Property X" property.
		await expect( page ).toClick(
			'.googlesitekit-analytics__select-property'
		);
		await expect( page ).toClick( '.mdc-menu-surface--open li', {
			text: /test property x/i,
		} );

		// Select "Set up a new view" option.
		await expect( page ).toClick(
			'.googlesitekit-analytics__select-profile'
		);
		await expect( page ).toClick( '.mdc-menu-surface--open li', {
			text: /set up a new view/i,
		} );

		await expect( page ).toClick( '.mdc-button--raised', {
			text: /configure analytics/i,
		} );

		// Click on confirm changes button and wait for permissions modal dialog.
		await page.waitForSelector( '.mdc-dialog--open .mdc-button', {
			timeout: 3000,
		} );

		// Click on proceed button and wait for oauth request.
		await Promise.all( [
			expect( page ).toClick( '.mdc-dialog--open .mdc-button', {
				text: /proceed/i,
			} ),
			page.waitForRequest( ( req ) =>
				req.url().match( 'sitekit.withgoogle.com/o/oauth2/auth' )
			),
		] );

		// When returning, their original action is automatically invoked, without requiring them to click the button again.
		await page.waitForRequest( ( req ) =>
			req.url().match( 'analytics/data/create-profile' )
		);

		// They should end up on the dashboard.
		await Promise.all( [
			page.waitForNavigation(),
			page.waitForSelector( '.googlesitekit-publisher-win__title' ),
		] );
		await expect( page ).toMatchElement(
			'.googlesitekit-publisher-win__title',
			{
				text: /Congrats on completing the setup for Analytics!/i,
			}
		);
		expect( console ).toHaveErrored(); // Permission scope error.
	} );
} );

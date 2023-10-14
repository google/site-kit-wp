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
	pageWait,
	step,
	ignorePermissionScopeErrors,
} from '../../../utils';
import * as fixtures from '../../../../../assets/js/modules/analytics-4/datastore/__fixtures__';

describe( 'Analytics write scope requests', () => {
	// These variables are used to determine whether or not we need to intercept requests to the server. By default the first request
	// won't be intercepted to reach the server and to trigger the insufficient scopes error on the server. The following requests will
	// be intercepted and mocked to immediately return fake data to emulate property/profile creation.
	let interceptCreatePropertyRequest;
	let interceptCreateWebDataStreamRequest;

	beforeAll( async () => {
		global.console.debug( 'beforeAll:start' );
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if (
				request
					.url()
					.startsWith(
						'https://sitekit.withgoogle.com/o/oauth2/auth'
					)
			) {
				const reqURL = new URL( request.url() );
				const scope = reqURL.searchParams.get( 'scope' );
				request.respond( {
					status: 302,
					headers: {
						location: createURL(
							'/wp-admin/index.php',
							`oauth2callback=1&code=valid-test-code&scope=${ encodeURIComponent(
								scope
							) }`
						),
					},
				} );
			} else if (
				request.url().match( 'analytics-4/data/create-account-ticket' )
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify( {
						// eslint-disable-next-line sitekit/acronym-case
						accountTicketId: 'testAccountTicketID',
					} ),
				} );
			} else if (
				request
					.url()
					.match(
						'/wp-json/google-site-kit/v1/modules/analytics-4/data/report?'
					)
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify( {} ),
				} );
			} else if (
				request.url().match( 'analytics-4/data/create-property' )
			) {
				if ( interceptCreatePropertyRequest ) {
					interceptCreatePropertyRequest = false;
					request.respond( {
						status: 200,
						body: JSON.stringify( {
							...fixtures.createProperty,
							_id: '1001', // Ensure match with ID in tests/e2e/plugins/module-setup-analytics.php
						} ),
					} );
				} else {
					request.continue();
				}
			} else if (
				request.url().match( 'analytics-4/data/create-webdatastream' )
			) {
				if ( interceptCreateWebDataStreamRequest ) {
					interceptCreateWebDataStreamRequest = false;
					request.respond( {
						status: 200,
						body: JSON.stringify( fixtures.createWebDataStream ),
					} );
				} else {
					request.continue();
				}
			} else if (
				request.url().match( 'analytics-4/data/conversion-events' ) ||
				request.url().match( 'search-console/data/searchanalytics' )
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify( [] ),
				} );
			} else if (
				request.url().match( 'analytics-4/data/google-tag-settings' )
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify( fixtures.googleTagSettings ),
				} );
			} else if (
				request.url().match( 'analytics-4/data/container-lookup' )
			) {
				request.respond( {
					body: JSON.stringify( fixtures.container ),
					status: 200,
				} );
			} else if (
				// Intercept request to GA TOS URL and redirect to gatoscallback.
				request
					.url()
					.includes( '//accounts.google.com/accountchooser' ) &&
				request.url().includes( 'provisioningSignup' )
			) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL(
							// Here we intentionally leave out the accountId to cut the process short and avoid API requests.
							'/wp-admin/index.php',
							'gatoscallback=1&accountTicketId=testAccountTicketID'
						),
					},
				} );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await setupSiteKit();
	} );

	afterEach( async () => {
		ignorePermissionScopeErrors();
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'prompts for additional permissions during a new Analytics account creation if the user has not granted the Analytics edit scope', async () => {
		interceptCreatePropertyRequest = true;
		interceptCreateWebDataStreamRequest = true;

		await step( 'arrange', async () => {
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
			await page.waitForSelector(
				'.googlesitekit-setup-module--analytics'
			);
			await page.waitForSelector( '.googlesitekit-setup-module__inputs' );

			global.console.debug( 'Wait for permission message' );

			// The user sees a notice above the button that explains they will need to grant additional permissions.
			await expect( page ).toMatchElement( 'p', {
				text: /You will need to give Site Kit permission to create an Analytics account/i,
			} );
		} );

		await step( 'act', async () => {
			global.console.debug( 'Click create account' );
			// Upon clicking the button, they're redirected to OAuth (should be mocked).
			// This request is intercepted above and handled through the oauth callback plugin.
			await expect( page ).toClick( '.mdc-button', {
				text: /create account/i,
			} );
			global.console.debug( 'Wait for create-account-ticket response' );
			// Once redirected back from OAuth, the user will end back on the Analytics setup screen
			// where the original action is automatically invoked, without requiring them to click the button again.
			// This request is intercepted above and returns a test account ticket ID.
			// Once the account ticket ID is received, the TOS URL will be available which will invoke a navigation
			// to the external Analytics TOS screen to action.
			await page.waitForResponse( ( res ) =>
				res.url().match( 'analytics-4/data/create-account-ticket' )
			);

			global.console.debug( 'Wait for provisioningSignup request' );
			await page.waitForRequest(
				( req ) =>
					req.isNavigationRequest() &&
					req.url().includes( 'provisioningSignup' )
			);
		} );

		global.console.debug( 'Wait for network idle' );
		// Without this, we might run into a weird issue when ending the test during the request above.
		await page.waitForNavigation( { waitUntil: 'networkidle2' } );
	} );

	it( 'prompts for additional permissions during a new Analytics property creation if the user has not granted the Analytics edit scope', async () => {
		// Don't intercept initial request to create property to trigger modal.
		interceptCreatePropertyRequest = false;
		interceptCreateWebDataStreamRequest = true;

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

		// Select "Set up a new property" option (GA4)
		await expect( page ).toClick(
			'.googlesitekit-analytics-4__select-property'
		);
		await expect( page ).toClick( '.mdc-menu-surface--open li', {
			text: /set up a new property/i,
		} );
		// Add a brief delay to allow the submit button to become enabled.
		await pageWait();

		// Click on confirm changes button and wait for permissions modal dialog.
		await expect( page ).toClick( '.mdc-button--raised', {
			text: /configure analytics/i,
		} );

		await page.waitForSelector( '.mdc-dialog--open .mdc-button', {
			timeout: 3000,
		} );

		interceptCreatePropertyRequest = true;

		await expect( page ).toClick( '.mdc-dialog--open .mdc-button', {
			text: /proceed/i,
		} );

		// expect( console ).toHaveErrored(); // Permission scope error.
		await page.waitForRequest( ( req ) =>
			req.url().match( 'analytics-4/data/create-property' )
		);
		await page.waitForRequest( ( req ) =>
			req.url().match( 'analytics-4/data/create-webdatastream' )
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
	} );

	it( 'prompts for additional permissions during a new Analytics web data stream creation if the user has not granted the Analytics edit scope', async () => {
		interceptCreatePropertyRequest = true;
		interceptCreateWebDataStreamRequest = false;
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

		// Select "example.com" property.
		await expect( page ).toClick(
			'.googlesitekit-analytics-4__select-property'
		);
		await expect( page ).toClick( '.mdc-menu-surface--open li', {
			text: /example.com/i,
		} );

		// Select "Set up a new web data stream" option.
		await expect( page ).toClick(
			'.googlesitekit-analytics-4__select-webdatastream'
		);
		await expect( page ).toClick( '.mdc-menu-surface--open li', {
			text: /set up a new web data stream/i,
		} );

		await expect( page ).toClick( '.mdc-button--raised', {
			text: /configure analytics/i,
		} );

		await page.waitForRequest( ( req ) =>
			req.url().match( 'analytics-4/data/create-webdatastream' )
		);

		// Click on confirm changes button and wait for permissions modal dialog.
		await page.waitForSelector( '.mdc-dialog--open .mdc-button', {
			timeout: 3000,
		} );

		interceptCreateWebDataStreamRequest = true;
		// Click on proceed button and wait for oauth request.
		await expect( page ).toClick( '.mdc-dialog--open .mdc-button', {
			text: /proceed/i,
		} );

		await page.waitForRequest( ( req ) =>
			req.url().includes( 'sitekit.withgoogle.com/o/oauth2/auth' )
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
	} );
} );

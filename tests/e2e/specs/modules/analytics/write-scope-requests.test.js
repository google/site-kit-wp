/**
 * Analytics write scope requests tests.
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
import { activatePlugin, createURL, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	resetSiteKit,
	setSearchConsoleProperty,
	useRequestInterception,
} from '../../../utils';

describe( 'Analytics write scope requests', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().startsWith( 'https://sitekit.withgoogle.com/o/oauth2/auth' ) ) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL( '/wp-admin/index.php', [
							'oauth2callback=1',
							'code=valid-test-code',
							// This is how the additional scope is granted.
							'scope=https://www.googleapis.com/auth/analytics.provision',
						].join( '&' ) ),
					},
				} );
			} else if ( request.url().match( 'analytics/data/create-account-ticket' ) ) {
				request.respond( {
					status: 200,
					body: JSON.stringify( { id: `${ Math.ceil( 1000 * Math.random() ) }` } ),
				} );
			} else if ( request.url().match( '/wp-json/google-site-kit/v1/data/' ) ) {
				request.respond( { status: 200 } );
			} else if ( request.url().match( `//analytics.google.com/analytics/web/` ) ) {
				request.respond( { status: 200 } );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await activatePlugin( 'e2e-tests-site-verification-plugin' );
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it.only( 'creating an analytics account when not having the https://www.googleapis.com/auth/analytics.provision scope yet.', async () => {
		await activatePlugin( 'e2e-tests-module-setup-analytics-api-mock-no-account' );
		await setSearchConsoleProperty();

		// Go to the analytics setup page.
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar' );
		await expect( page ).toClick( '.mdc-tab', { text: /connect more services/i } );
		await page.waitForSelector( '.googlesitekit-settings-connect-module--analytics' );
		await expect( page ).toClick( '.googlesitekit-cta-link', { text: /set up analytics/i } );
		await page.waitForSelector( '.googlesitekit-setup-module--analytics' );

		// The user sees a notice above the button that explains they will need to grant additional permissions.
		await expect( page ).toMatchElement( '#googlesitekit_analytics_need_permissions_msg' );

		// Upon clicking the button, they're redirected to OAuth (should be mocked).
		await Promise.all( [
			page.waitForNavigation(), // User is sent directly to OAuth.
			expect( page ).toClick( '.mdc-button', { text: /create account/i } ),
		] );

		// When returning, their original action is automatically invoked, without requiring them to click the button again.
		await page.waitForRequest( ( req ) => req.url().match( 'analytics/data/create-account-ticket' ) );

		// They should be redirected to the Analytics TOS (can be mocked to an immediate success redirect to Site Kit (...?gatoscallback=1...)).
		await page.waitForRequest( ( req ) => req.url().match( 'analytics.google.com/analytics/web' ) );
	} );

	it.todo( 'creating an Analytics property when not having the https://www.googleapis.com/auth/analytics.edit scope yet.' );

	it.todo( 'creating an Analytics view when not having the https://www.googleapis.com/auth/analytics.edit scope yet.' );
} );

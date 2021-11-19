/**
 * Analytics setup using GCP with no account and no tag e2e tests.
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
	pageWait,
} from '../../../utils';
import * as fixtures from '../../../../../assets/js/modules/analytics-4/datastore/__fixtures__';

describe( 'setting up the Analytics module using GCP auth with no existing account and no existing tag', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if (
				request
					.url()
					.startsWith( 'https://accounts.google.com/o/oauth2/auth' )
			) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL(
							'/wp-admin/index.php',
							[
								'oauth2callback=1',
								'code=valid-test-code',
								'e2e-site-verification=1',
								'scope=TEST_ALL_SCOPES',
							].join( '&' )
						),
					},
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
				request
					.url()
					.match(
						'google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
					)
			) {
				request.respond( { status: 200, body: JSON.stringify( {} ) } );
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics'
					)
			) {
				request.respond( { status: 200, body: JSON.stringify( {} ) } );
			} else if (
				request
					.url()
					.match( 'google-site-kit/v1/modules/analytics/data/goals' )
			) {
				request.respond( { status: 200, body: JSON.stringify( {} ) } );
			} else if (
				request.url().match( 'analytics-4/data/account-summaries' )
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify( {} ),
				} );
			} else if (
				request.url().match( 'analytics-4/data/create-property' )
			) {
				request.respond( {
					body: JSON.stringify( fixtures.createProperty ),
					status: 200,
				} );
			} else if (
				request.url().match( 'analytics-4/data/create-webdatastream' )
			) {
				request.respond( {
					body: JSON.stringify( fixtures.createWebDataStream ),
					status: 200,
				} );
			} else if ( request.url().match( 'analytics-4/data/properties' ) ) {
				request.respond( {
					status: 200,
					body: JSON.stringify( [] ),
				} );
			} else {
				request.continue();
			}
		} );
	} );
	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-gcp-auth-plugin' );
		await activatePlugin( 'e2e-tests-site-verification-plugin' );
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await activatePlugin(
			'e2e-tests-module-setup-analytics-api-mock-no-account'
		);
		await setSearchConsoleProperty();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'displays account creation form when user has no Analytics account', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar' );
		await expect( page ).toClick( '.mdc-tab', {
			text: /connect more services/i,
		} );
		await page.waitForSelector(
			'.googlesitekit-settings-connect-module--analytics'
		);

		await Promise.all( [
			page.waitForSelector(
				'.googlesitekit-setup-module__action .mdc-button'
			),
			expect( page ).toClick( '.googlesitekit-cta-link', {
				text: /set up analytics/i,
			} ),
		] );

		// Intercept the call to window.open and call our API to simulate a created account.
		await page.evaluate( () => {
			window.open = () => {
				window._e2eApiFetch( {
					path:
						'google-site-kit/v1/e2e/setup/analytics/account-created',
					method: 'post',
				} );
			};
		} );

		await pageWait( 1000 );
		// Clicking Create Account button will switch API mock plugins on the server to the one that has accounts.
		await Promise.all( [
			page.waitForResponse( ( res ) =>
				res
					.url()
					.match(
						'google-site-kit/v1/e2e/setup/analytics/account-created'
					)
			),
			expect( page ).toClick( '.mdc-button', {
				text: /Create an account/i,
			} ),
		] );

		await Promise.all( [
			page.waitForResponse( ( req ) =>
				req.url().match( 'analytics/data/accounts-properties-profiles' )
			),
			expect( page ).toClick( '.googlesitekit-cta-link', {
				text: /Re-fetch My Account/i,
			} ),
		] );

		await page.waitForSelector( '.googlesitekit-setup-module__inputs' );

		await expect(
			page
		).toMatchElement(
			'.googlesitekit-analytics__select-account .mdc-select__selected-text',
			{ text: '' }
		);
		await expect(
			page
		).toMatchElement(
			'.googlesitekit-analytics__select-property .mdc-select__selected-text',
			{ text: '' }
		);
		await expect(
			page
		).toMatchElement(
			'.googlesitekit-analytics__select-profile .mdc-select__selected-text',
			{ text: '' }
		);

		await pageWait( 1000 );
		await expect( page ).toClick( 'button', {
			text: /configure analytics/i,
		} );

		await page.waitForSelector(
			'.googlesitekit-publisher-win--win-success'
		);
		await expect( page ).toMatchElement(
			'.googlesitekit-publisher-win__title',
			{
				text: /Congrats on completing the setup for Analytics!/i,
			}
		);
	} );
} );

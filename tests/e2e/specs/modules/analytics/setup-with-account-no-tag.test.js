/**
 * Analytics module setup with account and no tag tests.
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
	setSearchConsoleProperty,
	wpApiFetch,
	useRequestInterception,
	pageWait,
	step,
} from '../../../utils';
import * as fixtures from '../../../../../assets/js/modules/analytics-4/datastore/__fixtures__';

async function proceedToSetUpAnalytics() {
	await step(
		'proceed to setup analytics page',
		Promise.all( [
			expect( page ).toClick( '.googlesitekit-cta-link', {
				text: /set up analytics/i,
			} ),
			page.waitForSelector( '.googlesitekit-setup-module__inputs' ),
			page.waitForRequest( ( req ) =>
				req.url().match( 'analytics/data' )
			),
		] )
	);
}

const setReferenceURL = async () => {
	return wpApiFetch( {
		path: 'google-site-kit/v1/e2e/reference-url',
		method: 'post',
		data: {
			url: 'http://non-matching-url.test',
		},
	} );
};

describe( 'setting up the Analytics module with an existing account and no existing tag', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );

		useRequestInterception( ( request ) => {
			if (
				request
					.url()
					.startsWith( 'https://accounts.google.com/o/oauth2/auth' )
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
									'e2e-site-verification=1',
									'scope=TEST_ALL_SCOPES',
								].join( '&' )
							),
						},
					},
					10
				);
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics'
					)
			) {
				request.respond(
					{ status: 200, body: JSON.stringify( {} ) },
					10
				);
			} else if (
				request
					.url()
					.match(
						'/wp-json/google-site-kit/v1/modules/analytics/data/report?'
					)
			) {
				request.respond(
					{
						status: 200,
						body: JSON.stringify( [] ),
					},
					10
				);
			} else if (
				request
					.url()
					.match( 'google-site-kit/v1/modules/analytics/data/goals' )
			) {
				request.respond(
					{ status: 200, body: JSON.stringify( {} ) },
					10
				);
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
			} else if (
				request.url().match( 'analytics-4/data/create-property' )
			) {
				request.respond(
					{
						body: JSON.stringify( fixtures.createProperty ),
						status: 200,
					},
					10
				);
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
					)
			) {
				request.respond(
					{ status: 200, body: JSON.stringify( {} ) },
					10
				);
			} else if (
				request.url().match( 'analytics-4/data/create-webdatastream' )
			) {
				request.respond(
					{
						body: JSON.stringify( fixtures.createWebDataStream ),
						status: 200,
					},
					10
				);
			} else if ( request.url().match( 'analytics-4/data/properties' ) ) {
				request.respond(
					{
						status: 200,
						body: JSON.stringify( [] ),
					},
					10
				);
			} else {
				request.continue( {}, 5 );
			}
		} );
	} );

	describe( 'using Proxy auth', () => {
		beforeEach( async () => {
			await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
			await activatePlugin( 'e2e-tests-site-verification-plugin' );
			await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
			await activatePlugin( 'e2e-tests-module-setup-analytics-api-mock' );
			await setSearchConsoleProperty();

			await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
			await page.waitForSelector( '.mdc-tab-bar' );
			await expect( page ).toClick( '.mdc-tab', {
				text: /connect more services/i,
			} );
			await page.waitForSelector(
				'.googlesitekit-settings-connect-module--analytics'
			);
		} );

		afterEach( async () => {
			await deactivateUtilityPlugins();
			await resetSiteKit();
		} );

		it( 'pre-selects account and property if the tag matches one belonging to the user', async () => {
			await proceedToSetUpAnalytics();

			await expect( page ).toMatchElement( '.mdc-select__selected-text', {
				text: /test account a/i,
			} );
			await expect( page ).toMatchElement( '.mdc-select__selected-text', {
				text: /test property x/i,
			} );
			await expect( page ).toMatchElement( '.mdc-select__selected-text', {
				text: /test profile x/i,
			} );

			// Select Test Account B
			await step( 'select test account B', async () => {
				await expect( page ).toClick( '.mdc-select', {
					text: /test account a/i,
				} );
				await Promise.all( [
					expect( page ).toClick(
						'.mdc-menu-surface--open .mdc-list-item',
						{
							text: /test account b/i,
						}
					),
					page.waitForResponse( ( res ) =>
						res.url().match( 'modules/analytics/data' )
					),
				] );

				// Selects reload with properties and profiles for Test Account B
				await expect( page ).toMatchElement(
					'.mdc-select__selected-text',
					{
						text: /test account b/i,
					}
				);
				await expect( page ).toMatchElement(
					'.mdc-select__selected-text',
					{
						text: /test property y/i,
					}
				);
				await expect( page ).toMatchElement(
					'.mdc-select__selected-text',
					{
						text: /test profile y/i,
					}
				);
			} );

			// Select Property Z
			await step( 'select property Z', async () => {
				await expect( page ).toClick( '.mdc-select', {
					text: /test property y/i,
				} );
				await Promise.all( [
					expect( page ).toClick(
						'.mdc-menu-surface--open .mdc-list-item',
						{
							text: /test property z/i,
						}
					),
					page.waitForResponse( ( res ) =>
						res.url().match( 'modules/analytics/data' )
					),
				] );

				// Selects reload with properties and profiles for Test Profile Z
				await expect( page ).toMatchElement(
					'.mdc-select__selected-text',
					{
						text: /test account b/i,
					}
				);
				await expect( page ).toMatchElement(
					'.mdc-select__selected-text',
					{
						text: /test property z/i,
					}
				);
				await expect( page ).toMatchElement(
					'.mdc-select__selected-text',
					{
						text: /test profile z/i,
					}
				);
			} );

			await step( 'wait and click configure button', async () => {
				await pageWait( 500 );
				await expect( page ).toClick( 'button', {
					text: /configure analytics/i,
				} );
			} );

			await step( 'redirect and check notification bar', async () => {
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

		it( 'prompts for account and property if the site URL does not match a property belonging to the user', async () => {
			await setReferenceURL();

			await proceedToSetUpAnalytics();

			await expect(
				page
			).toMatchElement(
				'.googlesitekit-analytics__select-account .mdc-select__selected-text',
				{ text: '' }
			);
			await expect( page ).not.toMatchElement(
				'.googlesitekit-analytics__select-property'
			);
			await expect( page ).not.toMatchElement(
				'.googlesitekit-analytics__select-profile'
			);

			await expect( page ).toMatchElement( 'button[disabled]', {
				text: /configure analytics/i,
			} );

			// Select Test Account A
			await step( 'select account A', async () => {
				await expect( page ).toClick(
					'.googlesitekit-analytics__select-account .mdc-select__selected-text'
				);
				await expect( page ).toClick(
					'.mdc-menu-surface--open .mdc-list-item',
					{
						text: /test account a/i,
					}
				);

				// See the selects populate
				await expect( page ).toMatchElement(
					'.mdc-select__selected-text',
					{
						text: /test account a/i,
					}
				);
				// Property dropdown should not select anything because there is no property associated with the current reference URL.
				await expect( page ).toMatchElement(
					'.googlesitekit-analytics__select-property',
					{
						text: /property/i,
					}
				);
				// Profile dropdown should not be displayed.
				await expect( page ).not.toMatchElement(
					'.googlesitekit-analytics__select-profile'
				);
			} );

			// Intentionally does not submit to trigger property & profile creation requests.
		} );
	} );

	describe( 'using GCP auth', () => {
		beforeEach( async () => {
			await activatePlugin( 'e2e-tests-gcp-auth-plugin' );
			await activatePlugin( 'e2e-tests-site-verification-plugin' );
			await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
			await activatePlugin( 'e2e-tests-module-setup-analytics-api-mock' );
			await setSearchConsoleProperty();

			await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
			await page.waitForSelector( '.mdc-tab-bar' );
			await expect( page ).toClick( '.mdc-tab', {
				text: /connect more services/i,
			} );
			await page.waitForSelector(
				'.googlesitekit-settings-connect-module--analytics'
			);
		} );

		afterEach( async () => {
			await deactivateUtilityPlugins();
			await resetSiteKit();
		} );
		it( 'includes an option to setup a new account', async () => {
			await proceedToSetUpAnalytics();

			await expect( page ).toMatchElement( '.mdc-select__selected-text', {
				text: /test account a/i,
			} );
			await expect( page ).toMatchElement( '.mdc-select__selected-text', {
				text: /test property x/i,
			} );
			await expect( page ).toMatchElement( '.mdc-select__selected-text', {
				text: /test profile x/i,
			} );

			await expect( page ).toClick(
				'.googlesitekit-analytics__select-account .mdc-select__selected-text'
			);
			await expect( page ).toClick(
				'.mdc-menu-surface--open .mdc-list-item',
				{
					text: /set up a new account/i,
				}
			);

			// Ensure dropdowns are now hidden.
			await expect( page ).not.toMatchElement(
				'.googlesitekit-setup-module--analytics select'
			);
			await expect( page ).toMatchElement( 'button', {
				text: /create an account/i,
			} );
			await expect( page ).toMatchElement( 'button', {
				text: /re-fetch my account/i,
			} );
			await Promise.all( [
				page.waitForResponse( ( res ) =>
					res.url().match( 'modules/analytics/data' )
				),
				expect( page ).toClick( 'button', {
					text: /re-fetch my account/i,
				} ),
			] );

			// Dropdowns are revealed and reset on refetch.
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
		} );
	} );
} );

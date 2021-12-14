/**
 * TagManager module setup tests.
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
	deactivatePlugin,
	visitAdminPage,
	createURL,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	pageWait,
	resetSiteKit,
	setAMPMode,
	setupSiteKit,
	useRequestInterception,
} from '../../../utils';
import liveContainerVersionFixture from '../../../../../assets/js/modules/tagmanager/datastore/__fixtures__/live-container-version.json';

async function proceedToTagManagerSetup() {
	await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
	await page.waitForSelector( '.mdc-tab-bar' );
	await expect( page ).toClick( '.mdc-tab', {
		text: /connect more services/i,
	} );
	await page.waitForSelector(
		'.googlesitekit-settings-connect-module--tagmanager'
	);

	await Promise.all( [
		page.waitForSelector(
			'.googlesitekit-setup-module__action .mdc-button'
		),
		expect( page ).toClick( '.googlesitekit-cta-link', {
			text: /set up tag manager/i,
		} ),
	] );
}

describe( 'Tag Manager module setup', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if (
				request
					.url()
					.match( 'google-site-kit/v1/core/site/data/notifications' )
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify( [] ),
				} );
			} else if (
				request
					.url()
					.match( 'modules/tagmanager/data/live-container-version' )
			) {
				// Return a live container version without GA.
				request.respond( {
					status: 200,
					body: JSON.stringify( liveContainerVersionFixture ),
				} );
			} else if (
				request
					.url()
					.match(
						/^https:\/\/www\.googletagmanager\.com\/(gtm\.js|amp\.json)/
					)
			) {
				request.respond( { status: 200 } );
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
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await setupSiteKit();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	describe( 'Setup without AMP active', () => {
		beforeAll( async () => {
			await deactivatePlugin( 'amp' );
		} );

		it( 'displays account creation form when user has no Tag Manager account', async () => {
			await activatePlugin(
				'e2e-tests-module-setup-tagmanager-api-mock-no-account'
			);
			await proceedToTagManagerSetup();

			// Intercept the call to window.open and call our API to simulate a created account.
			await page.evaluate( () => {
				window.open = () => {
					window._e2eApiFetch( {
						path:
							'google-site-kit/v1/e2e/setup/tagmanager/account-created',
						method: 'post',
					} );
				};
			} );

			// Clicking Create Account button will switch API mock plugins on the server to the one that has accounts.
			await Promise.all( [
				page.waitForResponse( ( res ) =>
					res
						.url()
						.match(
							'google-site-kit/v1/e2e/setup/tagmanager/account-created'
						)
				),
				expect( page ).toClick( '.mdc-button', {
					text: /Create an account/i,
				} ),
			] );

			await Promise.all( [
				page.waitForResponse( ( req ) =>
					req.url().match( 'tagmanager/data/accounts' )
				),
				expect( page ).toClick( '.googlesitekit-cta-link', {
					text: /Re-fetch My Account/i,
				} ),
			] );
			await page.waitForSelector( '.googlesitekit-setup-module__inputs' );

			// Ensure account and container selections are cleared.
			await expect(
				page
			).toMatchElement(
				'.googlesitekit-tagmanager__select-account .mdc-select__selected-text',
				{ text: '' }
			);
			await expect(
				page
			).toMatchElement(
				'.googlesitekit-tagmanager__select-container .mdc-select__selected-text',
				{ text: '' }
			);

			// Choose an account.
			await expect( page ).toClick(
				'.googlesitekit-tagmanager__select-account'
			);
			await expect( page ).toClick(
				'.mdc-menu-surface--open .mdc-list-item',
				{
					text: /test account a/i,
				}
			);

			// Ensure "Set up a new container" option is present in container select.
			await expect( page ).toClick(
				'.googlesitekit-tagmanager__select-container'
			);
			await expect( page ).toMatchElement(
				'.mdc-menu-surface--open .mdc-list-item',
				{
					text: /set up a new container/i,
				}
			);
			await expect( page ).toClick(
				'.mdc-menu-surface--open .mdc-list-item',
				{
					text: /test container x/i,
				}
			);

			await pageWait( 1000 );
			await expect( page ).toClick( 'button', {
				text: /confirm \& continue/i,
			} );

			await page.waitForSelector(
				'.googlesitekit-publisher-win--win-success'
			);
			await expect( page ).toMatchElement(
				'.googlesitekit-publisher-win__title',
				{
					text: /Congrats on completing the setup for Tag Manager!/i,
				}
			);

			// Ensure expected tag is placed.
			await Promise.all( [
				page.goto( createURL( '/' ) ),
				page.waitForNavigation(),
			] );
			await expect( page ).toMatchElement(
				'script[src^="https://www.googletagmanager.com/gtm.js?id=GTM-ABCXYZ"]'
			);
		} );

		it( 'displays available accounts and containers for the chosen account', async () => {
			await activatePlugin(
				'e2e-tests-module-setup-tagmanager-api-mock'
			);
			await proceedToTagManagerSetup();

			// Ensure only web container select is shown.
			await expect( page ).toMatchElement(
				'.googlesitekit-tagmanager__select-container--web'
			);
			await expect( page ).not.toMatchElement(
				'.googlesitekit-tagmanager__select-container--amp'
			);

			// Ensure account and container are not yet selected.
			await expect(
				page
			).toMatchElement(
				'.googlesitekit-tagmanager__select-account .mdc-select__selected-text',
				{ text: '' }
			);
			await expect(
				page
			).toMatchElement(
				'.googlesitekit-tagmanager__select-container .mdc-select__selected-text',
				{ text: '' }
			);

			// Ensure choosing an account loads the proper values.
			await expect( page ).toClick(
				'.googlesitekit-tagmanager__select-account'
			);
			await Promise.all( [
				page.waitForResponse( ( res ) =>
					res.url().match( 'modules/tagmanager/data' )
				),
				expect( page ).toClick(
					'.mdc-menu-surface--open .mdc-list-item',
					{
						text: /test account b/i,
					}
				),
			] );

			// Ensure account is selected.
			await expect(
				page
			).toMatchElement(
				'.googlesitekit-tagmanager__select-account .mdc-select__selected-text',
				{ text: /test account b/i }
			);

			// Select a container.
			await expect( page ).toClick(
				'.googlesitekit-tagmanager__select-container'
			);
			// Ensure no AMP containers are shown as options.
			// expect(...).not.toMatchElement with textContent matching does not work as expected.
			await expect(
				await page.$$eval(
					'.mdc-menu-surface--open .mdc-list-item',
					( nodes ) =>
						!! nodes.find( ( e ) =>
							e.textContent.match( /test amp container/i )
						)
				)
			).toStrictEqual( false );
			await expect( page ).toClick(
				'.mdc-menu-surface--open .mdc-list-item',
				{
					text: /test container y/i,
				}
			);

			await pageWait( 1000 );
			await expect( page ).toClick( 'button', {
				text: /confirm \& continue/i,
			} );

			await page.waitForSelector(
				'.googlesitekit-publisher-win--win-success'
			);
			await expect( page ).toMatchElement(
				'.googlesitekit-publisher-win__title',
				{
					text: /Congrats on completing the setup for Tag Manager!/i,
				}
			);

			// Ensure expected tag is placed.
			await Promise.all( [
				page.goto( createURL( '/' ) ),
				page.waitForNavigation(),
			] );
			await expect( page ).toMatchElement(
				'script[src^="https://www.googletagmanager.com/gtm.js?id=GTM-BCDWXY"]'
			);
		} );

		it( 'displays instructions for account creation when "Set up a new account" option is selected', async () => {
			await activatePlugin(
				'e2e-tests-module-setup-tagmanager-api-mock'
			);
			await proceedToTagManagerSetup();

			// Ensure "setup a new account" is an available choice.
			await expect( page ).toClick(
				'.googlesitekit-tagmanager__select-account'
			);
			await expect( page ).toMatchElement(
				'.mdc-menu-surface--open .mdc-list-item',
				{
					text: /set up a new account/i,
				}
			);

			// Choose set up a new account.
			await expect( page ).toClick(
				'.mdc-menu-surface--open .mdc-list-item',
				{
					text: /set up a new account/i,
				}
			);

			// Ensure instructions are present.
			await expect( page ).toMatchElement(
				'.googlesitekit-setup-module p',
				{
					text: /to create a new account/i,
				}
			);

			// Ensure buttons are present.
			await expect( page ).toMatchElement(
				'.googlesitekit-setup-module .mdc-button',
				{
					text: /create an account/i,
				}
			);
			await expect(
				page
			).toMatchElement(
				'.googlesitekit-setup-module .googlesitekit-cta-link',
				{ text: /re-fetch my account/i }
			);
		} );
	} );

	describe( 'Setup with AMP active', () => {
		beforeAll( async () => {
			await activatePlugin( 'amp' );
		} );

		beforeEach( async () => {
			await activatePlugin(
				'e2e-tests-module-setup-tagmanager-api-mock'
			);
			await proceedToTagManagerSetup();
		} );

		afterAll( async () => {
			await deactivatePlugin( 'amp' );
		} );

		describe( 'with Secondary AMP', () => {
			beforeAll( async () => {
				await setAMPMode( 'secondary' );
			} );

			it( 'renders both the AMP and web container select menus', async () => {
				await expect( page ).toMatchElement(
					'.googlesitekit-tagmanager__select-container--web'
				);
				await expect(
					page
				).toMatchElement(
					'.googlesitekit-tagmanager__select-container--web .mdc-floating-label',
					{ text: 'Web Container' }
				);
				await expect( page ).toMatchElement(
					'.googlesitekit-tagmanager__select-container--amp'
				);
				await expect(
					page
				).toMatchElement(
					'.googlesitekit-tagmanager__select-container--amp .mdc-floating-label',
					{ text: 'AMP Container' }
				);
			} );

			describe( 'when validating', () => {
				beforeEach( async () => {
					await page.waitForSelector(
						'.googlesitekit-tagmanager__select-account'
					);
					await expect( page ).toClick(
						'.googlesitekit-tagmanager__select-account'
					);
					await expect( page ).toClick(
						'.mdc-menu-surface--open .mdc-list-item',
						{
							text: /test account a/i,
						}
					);
					await expect( page ).toClick( 'button:not(:disabled)', {
						text: /confirm \& continue/i,
					} );
					await page.waitForSelector(
						'.googlesitekit-publisher-win--win-success'
					);
					await expect( page ).toMatchElement(
						'.googlesitekit-publisher-win__title',
						{
							text: /Congrats on completing the setup for Tag Manager!/i,
						}
					);
					await page.goto( createURL( '/', 'amp' ), {
						waitUntil: 'load',
					} );
				} );

				it( 'validates homepage AMP for logged-in users', async () => {
					await expect( page ).toHaveValidAMPForUser();
				} );

				it( 'validates homepage AMP for non-logged-in users', async () => {
					await expect( page ).toHaveValidAMPForVisitor();
				} );
			} );
		} );
	} );
} );

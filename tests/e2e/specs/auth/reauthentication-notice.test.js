/**
 * Reauthentication needed admin notice e2e tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
	setupSiteKit,
	useRequestInterception,
} from '../../utils';

describe( 'Reauthentication needed admin notice', () => {
	const additionalScope = 'https://www.googleapis.com/auth/e2e.additional';

	let simulateAbandonSetup = true;
	let oauthRequestURL;

	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			const url = request.url();
			if (
				url.startsWith( 'https://sitekit.withgoogle.com/o/oauth2/auth' )
			) {
				oauthRequestURL = url;

				if ( simulateAbandonSetup ) {
					request.respond( {
						status: 302,
						headers: {
							location: createURL( '/wp-admin/index.php' ),
						},
					} );
				} else {
					request.respond( {
						status: 302,
						headers: {
							location: createURL(
								'/wp-admin/index.php',
								'oauth2callback=1&code=valid-test-code'
							),
						},
					} );
				}
			} else if (
				url.match(
					'google-site-kit/v1/modules/analytics-4/data/account-summaries'
				)
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify( {} ),
				} );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		simulateAbandonSetup = true;
		oauthRequestURL = undefined;

		await setupSiteKit();
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	async function startAndAbandonAnalyticsSetup() {
		await activatePlugin( 'e2e-tests-mock-analytics-scopes-revoked' );

		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar' );
		await expect( page ).toClick( '.mdc-tab', {
			text: /connect more services/i,
		} );

		await page.waitForSelector( '.googlesitekit-cta-link' );
		await expect( page ).toClick( '.googlesitekit-cta-link', {
			text: /set up analytics/i,
		} );

		await page.waitForSelector(
			'#googlesitekit-notice-needs_reauthentication'
		);
	}

	it( 'redirects to analytics setup after reauth if the flow has been previously interrupted', async () => {
		await startAndAbandonAnalyticsSetup();

		simulateAbandonSetup = false;

		await expect( page ).toClick(
			'#googlesitekit-notice-needs_reauthentication',
			{
				text: /click here/i,
			}
		);

		await page.waitForNavigation();

		await expect( page ).toMatchElement(
			'.googlesitekit-setup-module--analytics'
		);
	} );

	it( 'passes the activation options of an interrupted setup through reauth', async () => {
		await startAndAbandonAnalyticsSetup();

		// Add the options a setup such as the RRM express setup stores, which
		// the notice should pass through to reauthentication.
		await page.evaluate(
			( options ) => {
				for ( const storage of [ localStorage, sessionStorage ] ) {
					const key = Object.keys( storage ).find( ( k ) =>
						/^googlesitekit_.*_module_setup$/.test( k )
					);

					if ( key ) {
						const item = JSON.parse( storage.getItem( key ) );
						item.value.options = options;
						storage.setItem( key, JSON.stringify( item ) );
						return;
					}
				}

				throw new Error( 'The module setup was not found in storage.' );
			},
			{
				additionalScopes: [ additionalScope ],
				redirectQueryArgs: { foo: 'bar' },
			}
		);

		simulateAbandonSetup = false;

		await expect( page ).toClick(
			'#googlesitekit-notice-needs_reauthentication',
			{
				text: /click here/i,
			}
		);

		await page.waitForNavigation();

		const requestedScopes = new URL( oauthRequestURL ).searchParams
			.get( 'scope' )
			.split( ' ' );
		expect( requestedScopes ).toContain( additionalScope );

		const { searchParams } = new URL( page.url() );
		expect( searchParams.get( 'slug' ) ).toBe( 'analytics-4' );
		expect( searchParams.get( 'foo' ) ).toBe( 'bar' );

		await expect( page ).toMatchElement(
			'.googlesitekit-setup-module--analytics'
		);
	} );
} );

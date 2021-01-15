/**
 * User Input Settings tests.
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
import { activatePlugin, createURL, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { deactivateUtilityPlugins, resetSiteKit, setupSiteKit, useRequestInterception } from '../utils';

describe( 'User Input Settings', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().startsWith( 'https://sitekit.withgoogle.com' ) ) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL( '/wp-admin/index.php', [
							'oauth2callback=1',
							'code=valid-test-code',
							'scope=https://www.googleapis.com/auth/analytics.provision',
						].join( '&' ) ),
					},
				} );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await setupSiteKit();
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await activatePlugin( 'e2e-tests-site-verification-plugin' );
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'New user flow', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );

		await Promise.all( [
			expect( page ).toClick( '.googlesitekit-start-setup' ),
			page.waitForNavigation(),
		] );

		await page.waitForSelector( '.googlesitekit-user-input__question' );

		await expect( page ).toClick( '#role-owner_with_team' );
		await expect( page ).toClick( '.googlesitekit-user-input__buttons--next' );

		await expect( page ).toClick( '#postFrequency-daily' );
		await expect( page ).toClick( '.googlesitekit-user-input__buttons--next' );

		await expect( page ).toClick( '#goals-publish_blog' );
		await expect( page ).toClick( '#goals-share_portfolio' );
		await expect( page ).toClick( '.googlesitekit-user-input__buttons--next' );

		await expect( page ).toClick( '#helpNeeded-retaining_visitors' );
		await expect( page ).toClick( '#helpNeeded-improving_performance' );
		await expect( page ).toClick( '#helpNeeded-help_better_rank' );
		await expect( page ).toClick( '.googlesitekit-user-input__buttons--next' );

		await expect( page ).toFill( '#searchTerms-keywords', 'One,Two,Three,' );
		await expect( page ).toClick( '.googlesitekit-user-input__buttons--next' );
	} );
} );

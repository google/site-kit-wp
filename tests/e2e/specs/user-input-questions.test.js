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
import { createURL, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	activatePlugins,
	deactivateUtilityPlugins,
	resetSiteKit,
	setupSiteKit,
	useRequestInterception,
	enableFeature,
} from '../utils';

describe( 'User Input Settings', () => {
	async function fillInInputSettings() {
		await page.waitForSelector( '.googlesitekit-user-input__question' );

		await expect( page ).toClick( '#role-owner_with_team' );
		await expect( page ).toClick( '.googlesitekit-user-input__buttons--next' );

		await expect( page ).toClick( '#postFrequency-monthly' );
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

		await Promise.all( [
			expect( page ).toClick( '.googlesitekit-user-input__buttons--next' ),
			page.waitForNavigation(),
		] );

		await page.waitForSelector( '#user-input-success' );
		await expect( page ).toMatchElement( '#user-input-success' );
	}

	beforeAll( async () => {
		await page.setRequestInterception( true );

		useRequestInterception( ( request ) => {
			const url = request.url();

			if ( url.startsWith( 'https://sitekit.withgoogle.com' ) ) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL( '/wp-admin/index.php', [
							'oauth2callback=1',
							'code=valid-test-code',
						].join( '&' ) ),
					},
				} );
			} else if ( url.match( '/google-site-kit/v1/core/user/data/user-input-settings' ) ) {
				request.continue();
			} else if ( url.match( '/google-site-kit/v1/data' ) || url.match( '/google-site-kit/v1/modules' ) ) {
				request.respond( { status: 200 } );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await enableFeature( 'userInput' );
		await setupSiteKit();
		await activatePlugins(
			'e2e-tests-oauth-callback-plugin',
			'e2e-tests-site-verification-plugin',
			'e2e-tests-proxy-credentials-plugin',
			'e2e-tests-user-input-settings-api-mock',
		);
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'should require new users to enter input settings after signing in', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );

		await Promise.all( [
			expect( page ).toClick( '.googlesitekit-start-setup' ),
			page.waitForNavigation(),
		] );

		await fillInInputSettings();
	} );

	it( 'should offer to enter input settings for existing users', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		await page.waitForSelector( '.googlesitekit-user-input__notification' );
		await Promise.all( [
			expect( page ).toClick( '.googlesitekit-notification__cta' ),
			page.waitForNavigation(),
		] );

		await fillInInputSettings();
	} );

	it( 'should let existing users enter input settings from the settings page', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );

		await page.waitForSelector( '.mdc-tab-bar' );
		await expect( page ).toClick( '.mdc-tab', { text: /admin settings/i } );

		await page.waitForSelector( '.googlesitekit-user-input__notification' );
		await Promise.all( [
			expect( page ).toClick( '.googlesitekit-notification__cta' ),
			page.waitForNavigation(),
		] );

		await fillInInputSettings();
	} );
} );

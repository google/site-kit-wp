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
	pageWait,
	step,
	setSearchConsoleProperty,
} from '../utils';

describe( 'User Input Settings', () => {
	async function fillInInputSettings() {
		await step( 'select role', async () => {
			await page.waitForSelector( '.googlesitekit-user-input__question' );
			await expect( page ).toClick( '#role-owner_with_team' );
		} );

		await step( 'select post frequency', async () => {
			await expect( page ).toClick(
				'.googlesitekit-user-input__buttons--next'
			);
			await expect( page ).toClick( '#postFrequency-monthly' );
		} );

		await step( 'select goals', async () => {
			await expect( page ).toClick(
				'.googlesitekit-user-input__buttons--next'
			);
			await expect( page ).toClick( '#goals-publish_blog' );
			await expect( page ).toClick( '#goals-share_portfolio' );
		} );

		await step( 'select help needed', async () => {
			await expect( page ).toClick(
				'.googlesitekit-user-input__buttons--next'
			);
			await expect( page ).toClick( '#helpNeeded-retaining_visitors' );
			await expect( page ).toClick( '#helpNeeded-improving_performance' );
			await expect( page ).toClick( '#helpNeeded-help_better_rank' );
		} );

		await step( 'enter keywords', async () => {
			await expect( page ).toClick(
				'.googlesitekit-user-input__buttons--next'
			);
			await expect( page ).toFill( '#searchTerms-keyword-0', 'One' );
			await expect( page ).toFill( '#searchTerms-keyword-1', 'Two' );
			await expect( page ).toFill( '#searchTerms-keyword-2', 'Three' );
		} );

		await step(
			'go to preview page',
			expect( page ).toClick( '.googlesitekit-user-input__buttons--next' )
		);

		await step(
			'wait for settings submission',
			Promise.all( [
				expect( page ).toClick(
					'.googlesitekit-user-input__buttons--next'
				),
				page.waitForNavigation(),
			] )
		);

		await step(
			'wait for success notification',
			page.waitForSelector( '#user-input-success' )
		);
	}

	beforeAll( async () => {
		await page.setRequestInterception( true );

		useRequestInterception( ( request ) => {
			const url = request.url();

			if ( url.startsWith( 'https://sitekit.withgoogle.com' ) ) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL(
							'/wp-admin/index.php',
							[
								'oauth2callback=1',
								'code=valid-test-code',
								'e2e-site-verification=1',
							].join( '&' )
						),
					},
				} );
			} else if (
				url.match(
					'/google-site-kit/v1/core/user/data/user-input-settings'
				)
			) {
				request.continue();
			} else if ( url.match( '/google-site-kit/v1/modules' ) ) {
				request.respond( { status: 200 } );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await enableFeature( 'userInput' );
		await activatePlugins(
			'e2e-tests-oauth-callback-plugin',
			'e2e-tests-user-input-settings-api-mock'
		);
		await setSearchConsoleProperty();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'should require new users to enter input settings after signing in', async () => {
		await step(
			'visit splash screen',
			visitAdminPage( 'admin.php', 'page=googlesitekit-splash' )
		);
		await step(
			'click on start setup button and wait for navigation',
			Promise.all( [
				expect( page ).toClick( '.googlesitekit-start-setup' ),
				page.waitForNavigation(),
			] )
		);

		await fillInInputSettings();
	} );

	it( 'should offer to enter input settings for existing users', async () => {
		await setupSiteKit();

		await step(
			'visit admin dashboard',
			visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' )
		);

		await step( 'click on CTA button and wait for navigation', async () => {
			await page.waitForSelector(
				'.googlesitekit-user-input__notification'
			);
			await Promise.all( [
				expect( page ).toClick( '.googlesitekit-notification__cta' ),
				page.waitForNavigation(),
			] );
		} );

		await fillInInputSettings();
	} );

	it( 'should let existing users enter input settings from the settings page', async () => {
		await setupSiteKit();

		await step( 'visit admin settings', async () => {
			await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
			await pageWait();
			await page.waitForSelector( '.mdc-tab-bar a.mdc-tab' );
			await expect( page ).toClick( 'a.mdc-tab', {
				text: /admin settings/i,
			} );
		} );

		await step( 'click on CTA button and wait for navigation', async () => {
			await page.waitForSelector(
				'.googlesitekit-user-input__notification'
			);
			await Promise.all( [
				expect( page ).toClick( '.googlesitekit-notification__cta' ),
				page.waitForNavigation(),
			] );
		} );

		await fillInInputSettings();
	} );
} );

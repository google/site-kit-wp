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
import { visitAdminPage } from '@wordpress/e2e-test-utils';

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
	setupAnalytics,
} from '../utils';

describe( 'User Input Settings', () => {
	async function fillInInputSettings() {
		await page.waitForSelector(
			'.googlesitekit-user-input__question--active'
		);

		await step( 'select purpose', async () => {
			await expect( page ).toClick( '#purpose-publish_blog' );
		} );

		await expect( page ).toClick(
			'.googlesitekit-user-input__question--active .googlesitekit-user-input__buttons--next'
		);

		await pageWait();

		await step( 'select post frequency', async () => {
			await expect( page ).toClick( '#postFrequency-monthly' );
		} );

		await expect( page ).toClick(
			'.googlesitekit-user-input__question--active .googlesitekit-user-input__buttons--next'
		);

		await pageWait();

		await step( 'select goals', async () => {
			await expect( page ).toClick( '#goals-retaining_visitors' );
			await expect( page ).toClick( '#goals-improving_performance' );
			await expect( page ).toClick( '#goals-help_better_rank' );
		} );

		await step( 'go to preview page', async () => {
			await expect( page ).toClick(
				'.googlesitekit-user-input__question--active .googlesitekit-user-input__buttons--next'
			);
		} );

		await pageWait();

		await step(
			'wait for settings submission',
			Promise.all( [
				expect( page ).toClick(
					'.googlesitekit-user-input__preview button',
					{ text: /save/i }
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

			if ( url.match( '/google-site-kit/v1/modules' ) ) {
				request.respond( { status: 200 } );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await enableFeature( 'userInput' );
		await activatePlugins(
			'e2e-tests-proxy-setup',
			'e2e-tests-oauth-callback-plugin'
		);
		await setSearchConsoleProperty();
		await page.setRequestInterception( true );
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'should offer to enter input settings for existing users', async () => {
		await setupSiteKit();
		await page.setRequestInterception( false );
		await setupAnalytics();
		await page.setRequestInterception( true );
		await setSearchConsoleProperty();

		await step(
			'visit admin dashboard',
			visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' )
		);

		await page.waitForSelector( '.googlesitekit-user-input__notification' );

		await step( 'click on CTA button and wait for navigation', async () => {
			await page.waitForSelector(
				'.googlesitekit-user-input__notification'
			);
			await Promise.all( [
				expect( page ).toClick(
					'.googlesitekit-user-input__notification .googlesitekit-cta-link'
				),
				page.waitForNavigation(),
			] );
		} );

		await fillInInputSettings();
	} );

	it( 'should let existing users enter input settings from the settings page', async () => {
		await setupSiteKit();
		await page.setRequestInterception( false );
		await setupAnalytics();
		await page.setRequestInterception( true );
		await setSearchConsoleProperty();

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
				expect( page ).toClick(
					'.googlesitekit-user-input__notification .googlesitekit-cta-link'
				),
				page.waitForNavigation(),
			] );
		} );

		await fillInInputSettings();
	} );
} );

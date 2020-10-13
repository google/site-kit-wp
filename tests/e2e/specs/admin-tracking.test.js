/**
 * Admin tracking opt in/out e2e tests.
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
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	pageWait,
	resetSiteKit,
	setSearchConsoleProperty,
	setupSiteKit,
} from '../utils';

async function toggleOptIn() {
	await page.waitForSelector( '#googlesitekit-opt-in' );
	await pageWait();
	await Promise.all( [
		page.waitForResponse( ( res ) => res.url().match( 'wp/v2/users/me' ) ),
		expect( page ).toClick( '#googlesitekit-opt-in' ),
	] );
}

describe( 'management of tracking opt-in/out via settings page', () => {
	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await activatePlugin( 'e2e-tests-site-verification-plugin' );
		await setSearchConsoleProperty();

		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar button.mdc-tab' );
		await expect( page ).toMatchElement( 'button.mdc-tab', { text: 'Admin Settings' } );

		await pageWait(); // Delay the next steps.

		// Click on Admin Settings Tab.
		await Promise.all( [
			page.waitForSelector( '#googlesitekit-opt-in' ),
			expect( page ).toClick( 'button.mdc-tab', { text: 'Admin Settings' } ),
		] );
	} );

	afterEach( async () => {
		await resetSiteKit();
		await deactivateUtilityPlugins();
	} );

	it( 'should be opted-out by default', async () => {
		await expect( page ).not.toHaveTracking();
		expect( await page.$eval( '#googlesitekit-opt-in', ( el ) => el.checked ) ).toBe( false );
	} );

	it( 'should have tracking code when opted in', async () => {
		await expect( page ).not.toHaveTracking();

		// Make sure the script tags are not yet loaded on the page.
		await expect( page ).not.toMatchElement( 'script[src^="https://www.googletagmanager.com/gtag/js?id=UA-130569087-3"]' );

		// Opt-in to tracking to ensure the checkbox is selected.
		await toggleOptIn();

		expect( await page.$eval( '#googlesitekit-opt-in', ( el ) => el.checked ) ).toBe( true );

		await expect( page ).toHaveTracking();
		// Ensure the script tags are injected into the page if they weren't
		// loaded already.
		await page.waitForSelector( 'script[src^="https://www.googletagmanager.com/gtag/js?id=UA-130569087-3"]' );

		// Ensure tag manager script tag exists.
		await expect( page ).toMatchElement( 'script[src^="https://www.googletagmanager.com/gtag/js?id=UA-130569087-3"]' );

		// Opt-out again.
		await toggleOptIn();
	} );

	it( 'should check opt-in box when clicked', async () => {
		await toggleOptIn();

		await page.waitForSelector( '.mdc-checkbox.mdc-checkbox--selected #googlesitekit-opt-in' );

		// Ensure checked checkbox exists.
		await expect( page ).toMatchElement( '.mdc-checkbox.mdc-checkbox--selected #googlesitekit-opt-in' );
	} );

	it( 'should uncheck opt-in box when clicked', async () => {
		// Opt-in to tracking to ensure the checkbox is selected.
		await toggleOptIn();

		// Uncheck the checkbox.
		await toggleOptIn();
		await page.waitForSelector( '.mdc-checkbox:not(.mdc-checkbox--selected) #googlesitekit-opt-in' );

		// Ensure unchecked checkbox exists.
		await expect( page ).toMatchElement( '.mdc-checkbox:not(.mdc-checkbox--selected) #googlesitekit-opt-in' );
	} );

	it( 'should not have tracking code when not opted in', async () => {
		// Ensure unchecked checkbox exists.
		await expect( page ).toMatchElement( '.mdc-checkbox:not(.mdc-checkbox--selected) #googlesitekit-opt-in' );

		// Ensure no analytics script tag exists.
		await expect( page ).not.toMatchElement( 'script[src^="https://www.google-analytics.com/analytics.js"]' );

		await expect( page ).not.toHaveTracking();
		// Ensure no tag manager script exists.
		await expect( page ).not.toMatchElement( 'script[src^="https://www.googletagmanager.com/gtag/js?id=UA-130569087-3"]' );
	} );
} );

describe( 'initialization on load for Site Kit screens', () => {
	describe( 'splash page', () => {
		afterEach( async () => await resetSiteKit() );

		it( 'does not load tracking if not opted-in', async () => {
			await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );

			await expect( page ).not.toHaveTracking();
		} );

		it( 'loads tracking when opted-in', async () => {
			await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
			await toggleOptIn();
			await page.reload();

			await expect( page ).toHaveTracking();
		} );
	} );

	describe( 'settings page', () => {
		beforeEach( async () => await setupSiteKit() );
		afterEach( async () => await resetSiteKit() );

		it( 'does not load tracking if not opted-in', async () => {
			await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );

			await expect( page ).not.toHaveTracking();
		} );

		it( 'loads tracking when opted-in', async () => {
			await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
			await toggleOptIn();
			await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );

			await expect( page ).toHaveTracking();
		} );
	} );

	describe( 'Site Kit dashboard', () => {
		beforeEach( async () => await setupSiteKit() );

		afterEach( async () => {
			await resetSiteKit();
			await deactivateUtilityPlugins();
		} );

		it( 'does not load tracking if not opted-in', async () => {
			await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

			await expect( page ).not.toHaveTracking();
			expect( console ).toHaveWarned();
		} );

		it( 'loads tracking when opted-in', async () => {
			await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
			await toggleOptIn();
			await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

			await expect( page ).toHaveTracking();
			expect( console ).toHaveWarned();
		} );
	} );

	describe( 'module pages', () => {
		beforeEach( async () => await setupSiteKit() );

		afterEach( async () => {
			await resetSiteKit();
			await deactivateUtilityPlugins();
		} );

		it( 'does not load tracking if not opted-in', async () => {
			await visitAdminPage( 'admin.php', 'page=googlesitekit-module-search-console' );

			await expect( page ).not.toHaveTracking();
			expect( console ).toHaveWarned();
		} );

		it( 'loads tracking when opted-in', async () => {
			await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
			await toggleOptIn();
			await visitAdminPage( 'admin.php', 'page=googlesitekit-module-search-console' );

			await expect( page ).toHaveTracking();
			expect( console ).toHaveWarned();
		} );
	} );
} );

describe( 'initialization on load for non-Site Kit screens', () => {
	describe( 'plugins page', () => {
		afterEach( async () => await resetSiteKit() );

		it( 'does not load tracking if not opted-in', async () => {
			await visitAdminPage( 'plugins.php' );

			await expect( page ).not.toHaveTracking();
			expect( console ).toHaveWarned();
		} );

		it( 'does not load tracking if opted-in', async () => {
			await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
			await toggleOptIn();
			await visitAdminPage( 'plugins.php' );

			await expect( page ).not.toHaveTracking();
		} );
	} );

	describe( 'WordPress dashboard', () => {
		afterEach( async () => await resetSiteKit() );

		it( 'does not load tracking if not opted-in', async () => {
			await visitAdminPage( 'index.php' );

			await expect( page ).not.toHaveTracking();
		} );

		it( 'does not load tracking if opted-in', async () => {
			await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
			await toggleOptIn();
			await visitAdminPage( 'index.php' );

			await expect( page ).not.toHaveTracking();
		} );
	} );
} );

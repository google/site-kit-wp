/**
 * Consent mode Playwright test.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	ensurePluginActive,
	setSiteVerification,
	setSearchConsoleProperty,
	enableConsentMode,
	withAdminPage,
	clearConsentCookies,
} = require( '../../playwright/utils' );

const euUserConsentPolicyRegions = [
	'AT',
	'BE',
	'BG',
	'CH',
	'CY',
	'CZ',
	'DE',
	'DK',
	'EE',
	'ES',
	'FI',
	'FR',
	'GB',
	'GR',
	'HR',
	'HU',
	'IE',
	'IS',
	'IT',
	'LI',
	'LT',
	'LU',
	'LV',
	'MT',
	'NL',
	'NO',
	'PL',
	'PT',
	'RO',
	'SE',
	'SI',
	'SK',
];

test.describe( 'Consent mode snippet', () => {
	test.beforeAll( async ( { browser } ) => {
		await withAdminPage( browser, async ( page ) => {
			await ensurePluginActive( page, 'wp-consent-api' );
			await ensurePluginActive( page, 'e2e-tests-proxy-auth-plugin' );
			await setSiteVerification( page );
			await setSearchConsoleProperty( page );
			await enableConsentMode( page );
		} );
	} );

	test.beforeEach( async ( { page } ) => {
		await page.goto( '/hello-world', { waitUntil: 'load' } );
	} );

	test.afterEach( async ( { context } ) => {
		await clearConsentCookies( context );
	} );

	test( 'configures the consent mode defaults', async ( { page } ) => {
		const dataLayer = await page.evaluate( () => window.dataLayer );

		expect( dataLayer ).toEqual( [
			{
				0: 'consent',
				1: 'default',
				2: {
					ad_personalization: 'denied',
					ad_storage: 'denied',
					ad_user_data: 'denied',
					analytics_storage: 'denied',
					functionality_storage: 'denied',
					personalization_storage: 'denied',
					region: euUserConsentPolicyRegions,
					security_storage: 'denied',
					wait_for_update: 500,
				},
			},
		] );
	} );

	test( 'enqueues a consent mode update in response to a `wp_set_consent()` call', async ( {
		page,
	} ) => {
		await page.evaluate( () => {
			window.wp_set_consent( 'marketing', 'allow' );
		} );

		const dataLayer = await page.evaluate( () => window.dataLayer );

		expect( dataLayer ).toEqual( [
			{
				0: 'consent',
				1: 'default',
				2: {
					ad_personalization: 'denied',
					ad_storage: 'denied',
					ad_user_data: 'denied',
					analytics_storage: 'denied',
					functionality_storage: 'denied',
					personalization_storage: 'denied',
					region: euUserConsentPolicyRegions,
					security_storage: 'denied',
					wait_for_update: 500,
				},
			},
			{
				0: 'consent',
				1: 'update',
				2: {
					ad_personalization: 'granted',
					ad_storage: 'granted',
					ad_user_data: 'granted',
				},
			},
		] );
	} );

	test( 'enqueues a consent mode update on page load when a CMP plugin is present', async ( {
		browser,
		page,
	} ) => {
		await page.evaluate( () => {
			// `wp_set_consent()` will persist the consent choice in a cookie.
			window.wp_set_consent( 'marketing', 'allow' );
		} );

		await page.reload();

		let dataLayer = await page.evaluate( () => window.dataLayer );

		// However, without a CMP plugin present, the consent state will not be updated on page load.
		expect( dataLayer ).toEqual( [
			{
				0: 'consent',
				1: 'default',
				2: {
					ad_personalization: 'denied',
					ad_storage: 'denied',
					ad_user_data: 'denied',
					analytics_storage: 'denied',
					functionality_storage: 'denied',
					personalization_storage: 'denied',
					region: euUserConsentPolicyRegions,
					security_storage: 'denied',
					wait_for_update: 500,
				},
			},
		] );

		// Activate the stub CMP plugin.
		await withAdminPage( browser, async ( adminPage ) => {
			await ensurePluginActive(
				adminPage,
				'e2e-tests-stub-consent-management-platform-plugin'
			);
		} );

		await page.goto( '/hello-world', { waitUntil: 'load' } );

		dataLayer = await page.evaluate( () => window.dataLayer );

		// Now, the consent state will be updated on page load.
		expect( dataLayer ).toEqual( [
			{
				0: 'consent',
				1: 'default',
				2: {
					ad_personalization: 'denied',
					ad_storage: 'denied',
					ad_user_data: 'denied',
					analytics_storage: 'denied',
					functionality_storage: 'denied',
					personalization_storage: 'denied',
					region: euUserConsentPolicyRegions,
					security_storage: 'denied',
					wait_for_update: 500,
				},
			},
			{
				0: 'consent',
				1: 'update',
				2: {
					ad_personalization: 'granted',
					ad_storage: 'granted',
					ad_user_data: 'granted',
				},
			},
		] );
	} );
} );

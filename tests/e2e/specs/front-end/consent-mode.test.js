/**
 * Consent Mode test.
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

/**
 * WordPress dependencies
 */
import { activatePlugin, createURL } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	setSiteVerification,
	setSearchConsoleProperty,
	wpApiFetch,
} from '../../utils';

const euUserConsentPolicyRegions = [
	'AT',
	'BE',
	'BG',
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

describe( 'Consent Mode snippet', () => {
	beforeAll( async () => {
		await activatePlugin( 'wp-consent-api' );
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();
		await wpApiFetch( {
			path: 'google-site-kit/v1/core/site/data/consent-mode',
			method: 'post',
			data: { data: { settings: { enabled: true } } },
		} );
	} );

	beforeEach( async () => {
		await page.goto( createURL( '/hello-world' ), { waitUntil: 'load' } );
	} );

	afterEach( async () => {
		const cookies = ( await page.cookies() ).filter( ( cookie ) =>
			cookie.name.startsWith( 'wp_consent_' )
		);
		await page.deleteCookie( ...cookies );
	} );

	it( 'configures the Consent Mode defaults', async () => {
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
					region: euUserConsentPolicyRegions,
					wait_for_update: 500,
				},
			},
		] );
	} );

	it( 'enqueues a Consent Mode update in response to a `wp_set_consent()` call', async () => {
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
					region: euUserConsentPolicyRegions,
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

	it( 'enqueues a Consent Mode update on page load when a CMP plugin is present', async () => {
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
					region: euUserConsentPolicyRegions,
					wait_for_update: 500,
				},
			},
		] );

		// Activate the stub CMP plugin.
		await activatePlugin(
			'e2e-tests-stub-consent-management-platform-plugin'
		);
		await page.goto( createURL( '/hello-world' ), { waitUntil: 'load' } );

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
					region: euUserConsentPolicyRegions,
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

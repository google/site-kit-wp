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
	enableFeature,
	wpApiFetch,
} from '../../utils';

const eeaRegions = [
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
	'UK',
];

describe( 'Consent Mode snippet', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();
		await enableFeature( 'consentMode' );
		await wpApiFetch( {
			path: 'google-site-kit/v1/core/site/data/consent-mode',
			method: 'post',
			data: { data: { settings: { enabled: true } } },
		} );
	} );

	beforeEach( async () => {
		await page.goto( createURL( '/hello-world' ), { waitUntil: 'load' } );
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
					regions: eeaRegions,
				},
			},
		] );
	} );
} );

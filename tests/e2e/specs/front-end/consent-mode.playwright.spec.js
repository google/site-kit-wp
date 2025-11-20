/**
 * Consent mode Playwright test.
 *
 * Site Kit by Google.
 */

const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const WP_BASE_URL = process.env.WP_BASE_URL || 'http://localhost:9002';
const WP_ADMIN_USERNAME = process.env.WP_USERNAME || 'admin';
const WP_ADMIN_PASSWORD = process.env.WP_PASSWORD || 'password';

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

async function loginAsAdmin( page ) {
	await page.goto( '/wp-admin/', { waitUntil: 'load' } );

	if ( await page.locator( '#user_login' ).count() ) {
		await page.fill( '#user_login', WP_ADMIN_USERNAME );
		await page.fill( '#user_pass', WP_ADMIN_PASSWORD );
		await Promise.all( [
			page.waitForNavigation( { waitUntil: 'networkidle' } ),
			page.click( '#wp-submit' ),
		] );
	}

	await expect( page ).toHaveURL( /\/wp-admin\/?/ );
}

async function ensurePluginActive( page, pluginSlug ) {
	await page.goto( '/wp-admin/plugins.php', { waitUntil: 'load' } );

	const pluginRow = page.locator( `tr[data-slug="${ pluginSlug }"]` );
	await expect( pluginRow ).toHaveCount( 1 );

	const activateAction = pluginRow.locator( 'span.activate a' );
	if ( await activateAction.count() ) {
		await Promise.all( [
			page.waitForNavigation( { waitUntil: 'networkidle' } ),
			activateAction.first().click(),
		] );
	}
}

async function wpApiFetch( page, options ) {
	await page.waitForFunction( () => window._e2eApiFetch !== undefined, null, {
		timeout: 5000,
	} );

	return await page.evaluate(
		( fetchOptions ) => window._e2eApiFetch( fetchOptions ),
		options
	);
}

async function setSiteVerification( page ) {
	await wpApiFetch( page, {
		path: 'google-site-kit/v1/e2e/setup/site-verification',
		method: 'post',
		data: { verified: true },
	} );
}

async function setSearchConsoleProperty( page ) {
	await wpApiFetch( page, {
		path: 'google-site-kit/v1/e2e/setup/search-console-property',
		method: 'post',
		data: { property: WP_BASE_URL },
	} );
}

async function enableConsentMode( page ) {
	await wpApiFetch( page, {
		path: 'google-site-kit/v1/core/site/data/consent-mode',
		method: 'post',
		data: { data: { settings: { enabled: true } } },
	} );
}

async function withAdminPage( browser, task ) {
	const context = await browser.newContext( { baseURL: WP_BASE_URL } );
	try {
		const adminPage = await context.newPage();
		await loginAsAdmin( adminPage );
		await task( adminPage );
		await adminPage.close();
	} finally {
		await context.close();
	}
}

async function clearConsentCookies( context ) {
	const cookies = await context.cookies();
	if ( ! cookies.length ) {
		return;
	}
	const hasConsentCookie = cookies.some( ( { name } ) =>
		name.startsWith( 'wp_consent_' )
	);
	if ( hasConsentCookie ) {
		await context.clearCookies();
	}
}

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

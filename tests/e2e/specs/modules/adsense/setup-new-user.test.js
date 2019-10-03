/**
 * WordPress dependencies
 */
import { createURL, activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	resetSiteKit,
	setAuthToken,
	setClientConfig,
	setSearchConsoleProperty,
	setSiteVerification,
	useRequestInterception,
} from '../../../utils';

async function proceedToAdsenseSetup() {
	await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
	await page.waitForSelector( '.mdc-tab-bar' );
	await expect( page ).toClick( '.mdc-tab', { text: /connect more services/i } );
	await page.waitForSelector( '.googlesitekit-settings-connect-module--adsense' );

	await Promise.all( [
		expect( page ).toClick( '.googlesitekit-cta-link', { text: /set up adsense/i } ),
		page.waitForSelector( '.googlesitekit-setup-module--adsense' ),
		page.waitForResponse( ( res ) => res.url().match( 'modules/adsense/data/accounts' ) ),
		page.waitForResponse( ( res ) => res.url().match( 'modules/adsense/data/account-status' ) ),
	] );
}

const defaultHandler = ( request ) => request.continue();
const datapointHandlers = {
	accounts: defaultHandler,
	alerts: defaultHandler,
	clients: defaultHandler,
};

const ADSENSE_ACCOUNT = {
	id: 'pub-123456789',
	kind: 'adsense#account',
	name: 'pub-123456789',
	premium: false,
	timezone: 'America/Chicago',
};

describe( 'setting up the AdSense module', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().match( 'modules/adsense/data/accounts' ) ) {
				datapointHandlers.accounts( request );
			} else if ( request.url().match( 'modules/adsense/data/alerts' ) ) {
				datapointHandlers.alerts( request );
			} else if ( request.url().match( 'modules/adsense/data/clients' ) ) {
				datapointHandlers.clients( request );
			} else if ( request.url().startsWith( 'https://accounts.google.com/o/oauth2/auth' ) ) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL( '/', [
							'oauth2callback=1',
							'code=valid-test-code',
							'e2e-site-verification=1',
							'scope=TEST_ALL_SCOPES',
						].join( '&' ) ),
					},
				} );
			} else if ( request.url().match( '/wp-json/google-site-kit/v1/data/' ) ) {
				request.respond( {
					status: 200,
				} );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await setSearchConsoleProperty();

		await setClientConfig();
		await setAuthToken();
		await setSiteVerification();
		await setSearchConsoleProperty();
	} );

	afterEach( async () => {
		Object.keys( datapointHandlers ).forEach( ( key ) => {
			return datapointHandlers[ key ] = defaultHandler;
		} );
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'displays “We’re getting your site ready for ads” when account is graylisted', async () => {
		datapointHandlers.accounts = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( [
					ADSENSE_ACCOUNT,
				] ),
			} );
		};
		datapointHandlers.alerts = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( [
					{
						id: 'BILLINGLESS_ACCOUNT',
						isDismissible: false,
						kind: 'adsense#alert',
						message: "Your ad units are not displaying ads because you haven't provided your account payments information yet.",
						severity: 'SEVERE',
						type: 'BILLINGLESS_ACCOUNT',
					},
					{
						id: 'GRAYLISTED_PUBLISHER',
						isDismissible: false,
						kind: 'adsense#alert',
						message: 'Your AdSense application is still under review. You will only see blank ads until your account has been fully approved or disapproved.',
						severity: 'SEVERE',
						type: 'GRAYLISTED_PUBLISHER',
					},
					{
						id: 'ALERT_TYPE_GLOBAL_BETTER_ADS_STANDARD',
						isDismissible: false,
						kind: 'adsense#alert',
						message: "Global Better Ads Standards. Google Chrome will support the Better Ads Standards globally from July 9th. Ads may be filtered on Chrome browsers if you don't comply with the standard.",
						severity: 'INFO',
						type: 'ALERT_TYPE_GLOBAL_BETTER_ADS_STANDARD',
					},
				] ),
			} );
		};

		await expect( '/' ).not.toHaveAdSenseTag();

		await proceedToAdsenseSetup();

		await page.waitForSelector( '.googlesitekit-setup-module--adsense' );

		await expect( page ).toMatchElement( '.googlesitekit-heading-4.googlesitekit-setup-module__title', { text: /We’re getting your site ready for ads/i } );
		await expect( page ).toMatchElement( '.googlesitekit-cta-link', { text: /Go to your AdSense account to check on your site’s status/i } );

		await expect( '/' ).not.toHaveAdSenseTag();
	} );

	it( 'displays “We’re getting your site ready for ads” when the Adsense account is missing the address or phone not verified', async () => {
		datapointHandlers.accounts = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( [
					ADSENSE_ACCOUNT,
				] ),
			} );
		};
		datapointHandlers.alerts = ( request ) => {
			request.respond( {
				status: 500,
				body: JSON.stringify( {
					code: 403,
					message: {
						error: {
							errors: [
								{
									domain: 'global',
									reason: 'accountPendingReview',
									message: 'Users account is pending review.',
								},
							],
							code: 403,
							message: 'Users account is pending review.',
						},
					},
					data: {
						status: 500,
					},
				} ),
			} );
		};
		datapointHandlers.clients = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( [
					{
						arcOptIn: false,
						id: `ca-${ ADSENSE_ACCOUNT.id }`,
						kind: 'adsense#adClient',
						productCode: 'AFC',
						supportsReporting: true,
					},
				] ),
			} );
		};

		await expect( '/' ).not.toHaveAdSenseTag();

		await proceedToAdsenseSetup();

		await page.waitForSelector( '.googlesitekit-setup-module--adsense' );

		await expect( page ).toMatchElement( '.googlesitekit-setup-module__title', { text: /We’re getting your site ready for ads/i } );
		await expect( page ).toMatchElement( '.googlesitekit-cta-link', { text: /Go to your AdSense account to check on your site’s status/i } );

		await expect( '/' ).toHaveAdSenseTag();
	} );

	it( 'displays “Your site isn’t ready to show ads yet” when the users account is disapproved', async () => {
		datapointHandlers.accounts = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( {
					code: 403,
					message: {
						error: {
							errors: [
								{
									domain: 'global',
									reason: 'disapprovedAccount',
									message: 'Users account has been disapproved.',
								},
							],
							code: 403,
							message: 'Users account has been disapproved.',
						},
					},
					data: {
						status: 500,
					},
				} ),
			} );
		};

		await expect( '/' ).not.toHaveAdSenseTag();

		await proceedToAdsenseSetup();

		await page.waitForSelector( '.googlesitekit-setup-module--adsense' );

		await expect( page ).toMatchElement( '.googlesitekit-setup-module__title', { text: /Your site isn’t ready to show ads yet/i } );
		await expect( page ).toMatchElement( '.googlesitekit-cta-link', { text: /Go to AdSense to find out how to fix the issue/i } );

		await expect( '/' ).not.toHaveAdSenseTag();
	} );

	it( 'displays “Create your AdSense account” when the user does not have an AdSense account', async () => {
		datapointHandlers.accounts = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( {
					code: 403,
					message: {
						error: {
							errors: [
								{
									domain: 'global',
									reason: 'noAdSenseAccount',
									message: 'User does not have an AdSense account.',
								},
							],
							code: 403,
							message: 'User does not have an AdSense account.',
						},
					},
					data: {
						status: 500,
					},
				} ),
			} );
		};

		await expect( '/' ).not.toHaveAdSenseTag();

		await proceedToAdsenseSetup();

		await page.waitForSelector( '.googlesitekit-setup-module--adsense' );

		await expect( page ).toMatchElement( '.googlesitekit-setup-module__title', { text: /Create your AdSense account/i } );
		await expect( page ).toMatchElement( '.googlesitekit-cta-link', { text: /Create AdSense Account/i } );

		await expect( '/' ).not.toHaveAdSenseTag();
	} );
} );

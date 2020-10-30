/**
 * AdSense module setup tests.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import {
	createURL,
	deactivatePlugin,
	activatePlugin,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	activateAMPWithMode,
	setAMPMode,
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
		page.waitForRequest( ( req ) => req.url().match( 'modules/adsense/data/settings' ) && 'POST' === req.method() ),
	] );
}

// Return empty array as a sane default, to avoid real requests.
const defaultHandler = ( request ) => {
	request.respond( {
		status: 200,
		body: JSON.stringify( [] ),
	} );
};

const datapointHandlers = {
	accounts: defaultHandler,
	clients: defaultHandler,
	alerts: defaultHandler,
	urlchannels: defaultHandler,
};

const ADSENSE_ACCOUNT = {
	id: 'pub-123456789',
	kind: 'adsense#account',
	name: 'pub-123456789',
	premium: false,
	timezone: 'America/Chicago',
};

const ADSENSE_CLIENT = {
	arcOptIn: false,
	id: `ca-${ ADSENSE_ACCOUNT.id }`,
	kind: 'adsense#adClient',
	productCode: 'AFC',
	supportsReporting: true,
};

describe( 'setting up the AdSense module', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().match( 'modules/adsense/data/accounts' ) ) {
				datapointHandlers.accounts( request );
			} else if ( request.url().match( 'modules/adsense/data/clients' ) ) {
				datapointHandlers.clients( request );
			} else if ( request.url().match( 'modules/adsense/data/alerts' ) ) {
				datapointHandlers.alerts( request );
			} else if ( request.url().match( 'modules/adsense/data/urlchannels' ) ) {
				datapointHandlers.urlchannels( request );
			} else if ( request.url().startsWith( 'https://accounts.google.com/o/oauth2/auth' ) ) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL( '/wp-admin/index.php', [
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
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
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

	it( 'displays “Your account is getting ready” when account is graylisted', async () => {
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

		await expect( page ).toMatchElement( '.googlesitekit-setup-module__title', { text: /Your account is getting ready/i } );
		await expect( page ).toMatchElement( '.googlesitekit-cta-link', { text: /Go to your AdSense account to check on your site’s status or to complete setting up/i } );

		await expect( '/' ).not.toHaveAdSenseTag();
	} );

	it( 'displays “Your account is getting ready” when the Adsense account is pending review', async () => {
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
				status: 403,
				body: JSON.stringify( {
					code: 403,
					message: 'Users account is pending review.',
					data: {
						status: 403,
						reason: 'accountPendingReview',
					},
				} ),
			} );
		};
		datapointHandlers.clients = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( [
					ADSENSE_CLIENT,
				] ),
			} );
		};

		await expect( '/' ).not.toHaveAdSenseTag();

		await proceedToAdsenseSetup();

		await expect( page ).toMatchElement( '.googlesitekit-setup-module__title', { text: /Your account is getting ready/i } );
		await expect( page ).toMatchElement( '.googlesitekit-cta-link', { text: /Go to your AdSense account to check on your site’s status or to complete setting up/i } );

		await expect( '/' ).toHaveAdSenseTag();
	} );

	it( 'displays “Your site isn’t ready to show ads yet” when the users account is disapproved', async () => {
		datapointHandlers.accounts = ( request ) => {
			request.respond( {
				status: 403,
				body: JSON.stringify( {
					code: 403,
					message: 'Users account has been disapproved.',
					data: {
						status: 403,
						reason: 'disapprovedAccount',
					},
				} ),
			} );
		};

		await expect( '/' ).not.toHaveAdSenseTag();

		await proceedToAdsenseSetup();

		await expect( page ).toMatchElement( '.googlesitekit-setup-module__title', { text: /Your site isn’t ready to show ads yet/i } );
		await expect( page ).toMatchElement( '.googlesitekit-cta-link', { text: /Go to AdSense to find out how to fix the issue/i } );

		await expect( '/' ).not.toHaveAdSenseTag();
	} );

	it( 'displays “Create your AdSense account” when the user does not have an AdSense account', async () => {
		datapointHandlers.accounts = ( request ) => {
			request.respond( {
				status: 403,
				body: JSON.stringify( {
					code: 403,
					message: 'User does not have an AdSense account.',
					data: {
						status: 403,
						reason: 'noAdSenseAccount',
					},
				} ),
			} );
		};

		await expect( '/' ).not.toHaveAdSenseTag();

		await proceedToAdsenseSetup();

		await expect( page ).toMatchElement( '.googlesitekit-setup-module__title', { text: /Create your AdSense account/i } );
		await expect( page ).toMatchElement( '.googlesitekit-setup-module__action', { text: /Create AdSense Account/i } );

		await expect( '/' ).not.toHaveAdSenseTag();
	} );

	describe( 'AMP is setup', () => {
		beforeEach( async () => {
			await activateAMPWithMode( 'primary' );
		} );
		afterEach( async () => {
			await deactivatePlugin( 'amp' );
		} );
		it( 'has valid AMP for logged-in users', async () => {
			datapointHandlers.accounts = ( request ) => {
				request.respond( {
					status: 200,
					body: JSON.stringify( [
						ADSENSE_ACCOUNT,
					] ),
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

			await proceedToAdsenseSetup();
			await expect( '/' ).toHaveValidAMPForUser();
		} );

		it( 'has valid AMP for non-logged in users', async () => {
			await activateAMPWithMode( 'primary' );
			datapointHandlers.accounts = ( request ) => {
				request.respond( {
					status: 200,
					body: JSON.stringify( [
						ADSENSE_ACCOUNT,
					] ),
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

			await proceedToAdsenseSetup();
			await expect( '/' ).toHaveValidAMPForVisitor();
		} );
	} );
} );

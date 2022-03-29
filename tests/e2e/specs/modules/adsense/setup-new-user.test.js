/**
 * AdSense module setup tests.
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
	deactivateUtilityPlugins,
	resetSiteKit,
	setAuthToken,
	setClientConfig,
	setSearchConsoleProperty,
	setSiteVerification,
	useRequestInterception,
	step,
	screenshot,
} from '../../../utils';

async function proceedToAdsenseSetup() {
	await step(
		'visit admin page',
		visitAdminPage( 'admin.php', 'page=googlesitekit-settings' )
	);
	// await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
	await step(
		'wait for selector mdc-tab-bar',
		page.waitForSelector( '.mdc-tab-bar' )
	);
	await step(
		'connect more services',
		expect( page ).toClick( '.mdc-tab', {
			text: /connect more services/i,
		} )
	);
	await step(
		'wait for selector googlesitekit-settings-connect-module--adsense',
		page.waitForSelector(
			'.googlesitekit-settings-connect-module--adsense'
		)
	);

	await Promise.all( [
		expect( page ).toClick( '.googlesitekit-cta-link', {
			text: /set up adsense/i,
		} ),
		page.waitForSelector( '.googlesitekit-setup-module--adsense' ),
		page.waitForResponse( ( res ) =>
			res.url().match( 'modules/adsense/data/accounts' )
		),
		page.waitForRequest(
			( req ) =>
				req.url().match( 'modules/adsense/data/settings' ) &&
				'POST' === req.method()
		),
	] );
}

// Return empty array as a default, to avoid real requests.
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
	name: 'accounts/pub-123456789',
	displayName: 'pub-123456789',
	timezone: {
		id: 'America/Chicago',
	},
	createTime: '2013-10-17T15:51:03.000Z',
	_id: 'pub-123456789',
};

const ADSENSE_CLIENT = {
	name: `accounts/${ ADSENSE_ACCOUNT._id }/adclients/ca-${ ADSENSE_ACCOUNT._id }`,
	reportingDimensionId: `ca-${ ADSENSE_ACCOUNT._id }`, // eslint-disable-line sitekit/acronym-case
	productCode: 'AFC',
	_id: `ca-${ ADSENSE_ACCOUNT._id }`,
	_accountID: ADSENSE_ACCOUNT._id,
};

describe( 'setting up the AdSense module', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().match( 'modules/adsense/data/accounts' ) ) {
				datapointHandlers.accounts( request );
			} else if (
				request.url().match( 'modules/adsense/data/clients' )
			) {
				datapointHandlers.clients( request );
			} else if ( request.url().match( 'modules/adsense/data/alerts' ) ) {
				datapointHandlers.alerts( request );
			} else if (
				request.url().match( 'modules/adsense/data/urlchannels' )
			) {
				datapointHandlers.urlchannels( request );
			} else if (
				request
					.url()
					.startsWith( 'https://accounts.google.com/o/oauth2/auth' )
			) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL(
							'/wp-admin/index.php',
							[
								'oauth2callback=1',
								'code=valid-test-code',
								'e2e-site-verification=1',
								'scope=TEST_ALL_SCOPES',
							].join( '&' )
						),
					},
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
			return ( datapointHandlers[ key ] = defaultHandler );
		} );
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'displays “Your account is getting ready” when account is graylisted', async () => {
		datapointHandlers.accounts = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( [ ADSENSE_ACCOUNT ] ),
			} );
		};
		datapointHandlers.alerts = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( [
					{
						name: `accounts/${ ADSENSE_ACCOUNT._id }/alerts/e38f3957-be27-31cc-8d33-ba4b1f6e84c2`,
						severity: 'SEVERE',
						message:
							"Your ad units are not displaying ads because you haven't provided your account payments information yet.",
						type: 'billingless-account',
					},
					{
						name: `accounts/${ ADSENSE_ACCOUNT._id }/alerts/ef158442-c283-3866-a3af-5f9cf7e190f3`,
						severity: 'SEVERE',
						message:
							'Your AdSense application is still under review. You will only see blank ads until your account has been fully approved or disapproved.',
						type: 'graylisted-publisher',
					},
				] ),
			} );
		};

		await expect( '/' ).not.toHaveAdSenseTag();

		await proceedToAdsenseSetup();

		await expect( page ).toMatchElement(
			'.googlesitekit-setup-module__title',
			{
				text: /Your account is getting ready/i,
			}
		);
		await expect( page ).toMatchElement( '.googlesitekit-cta-link', {
			text: /Go to your AdSense account to check on your site’s status or to complete setting up/i,
		} );

		await expect( '/' ).not.toHaveAdSenseTag();
	} );

	it( 'displays “Your account is getting ready” when the Adsense account is pending review', async () => {
		datapointHandlers.accounts = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( [ ADSENSE_ACCOUNT ] ),
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
				body: JSON.stringify( [ ADSENSE_CLIENT ] ),
			} );
		};

		await expect( '/' ).not.toHaveAdSenseTag();

		await proceedToAdsenseSetup();

		await expect( page ).toMatchElement(
			'.googlesitekit-setup-module__title',
			{
				text: /Your account is getting ready/i,
			}
		);
		await expect( page ).toMatchElement( '.googlesitekit-cta-link', {
			text: /Go to your AdSense account to check on your site’s status or to complete setting up/i,
		} );

		await expect( '/' ).toHaveAdSenseTag();
		expect( console ).toHaveErrored(); // 403 Response.
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

		await expect( page ).toMatchElement(
			'.googlesitekit-setup-module__title',
			{
				text: /Your site isn’t ready to show ads yet/i,
			}
		);
		await expect( page ).toMatchElement( '.googlesitekit-cta-link', {
			text: /Go to AdSense to find out how to fix the issue/i,
		} );

		await expect( '/' ).not.toHaveAdSenseTag();
		expect( console ).toHaveErrored(); // 403 Response.
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

		await expect( page ).toMatchElement(
			'.googlesitekit-setup-module__title',
			{
				text: /Create your AdSense account/i,
			}
		);
		await expect( page ).toMatchElement(
			'.googlesitekit-setup-module__action',
			{
				text: /Create AdSense Account/i,
			}
		);

		await expect( '/' ).not.toHaveAdSenseTag();
		expect( console ).toHaveErrored(); // 403 Response.
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
					body: JSON.stringify( [ ADSENSE_ACCOUNT ] ),
				} );
			};

			datapointHandlers.clients = ( request ) => {
				request.respond( {
					status: 200,
					body: JSON.stringify( [ ADSENSE_CLIENT ] ),
				} );
			};

			await screenshot( 'logged-in, pre proceedToAdsenseSetup' );

			await proceedToAdsenseSetup();

			await screenshot( 'logged-in, post proceedToAdsenseSetup' );

			await step(
				'expect toHaveValidAMPForUser',
				expect( '/' ).toHaveValidAMPForUser()
			);
			// await expect( '/' ).toHaveValidAMPForUser();
		} );

		it( 'has valid AMP for non-logged in users', async () => {
			await activateAMPWithMode( 'primary' );
			datapointHandlers.accounts = ( request ) => {
				request.respond( {
					status: 200,
					body: JSON.stringify( [ ADSENSE_ACCOUNT ] ),
				} );
			};

			datapointHandlers.clients = ( request ) => {
				request.respond( {
					status: 200,
					body: JSON.stringify( [ ADSENSE_CLIENT ] ),
				} );
			};

			await screenshot( 'non-logged-in, pre proceedToAdsenseSetup' );

			await proceedToAdsenseSetup();

			await screenshot( 'non-logged-in, post proceedToAdsenseSetup' );

			await step(
				'expect toHaveValidAMPForVisitor',
				expect( '/' ).toHaveValidAMPForVisitor()
			);
			// await expect( '/' ).toHaveValidAMPForVisitor();
		} );
	} );
} );

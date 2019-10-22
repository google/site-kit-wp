/**
 * WordPress dependencies
 */
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	resetSiteKit,
	setAnalyticsExistingPropertyId,
	setAuthToken,
	setClientConfig,
	setSearchConsoleProperty,
	setSiteVerification,
	useRequestInterception,
} from '../../../utils';

async function proceedToSetUpAnalytics() {
	await Promise.all( [
		expect( page ).toClick( '.googlesitekit-cta-link', { text: /set up analytics/i } ),
		page.waitForSelector( '.googlesitekit-setup-module--analytics' ),
		page.waitForResponse( ( res ) => res.url().match( 'analytics/data' ) ),
	] );
}

const EXISTING_PROPERTY_ID = 'UA-00000001-1';
const EXISTING_ACCOUNT_ID = '100';

let getAccountsRequestHandler;
let tagPermissionRequestHandler;

describe( 'setting up the Analytics module with an existing account and existing tag', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().match( 'modules/analytics/data/accounts-properties-profiles' ) && getAccountsRequestHandler ) {
				getAccountsRequestHandler( request );
			} else if ( request.url().match( 'modules/analytics/data/tag-permission' ) && tagPermissionRequestHandler ) {
				tagPermissionRequestHandler( request );
			} else if ( request.url().match( '/wp-json/google-site-kit/v1/data/' ) ) {
				request.respond( {
					status: 200,
				} );
			}

			if ( ! request._interceptionHandled ) {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await activatePlugin( 'e2e-tests-analytics-existing-tag' );
		await activatePlugin( 'e2e-tests-module-setup-analytics-api-mock' );

		await setClientConfig();
		await setAuthToken();
		await setSiteVerification();
		await setSearchConsoleProperty();

		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar' );
		await expect( page ).toClick( '.mdc-tab', { text: /connect more services/i } );
		await page.waitForSelector( '.googlesitekit-settings-connect-module--analytics' );
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'pre-selects account and property if an existing tag is found that matches one belonging to the user and prevents them from being changed', async () => {
		tagPermissionRequestHandler = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( {
					accountID: EXISTING_ACCOUNT_ID,
					propertyId: EXISTING_PROPERTY_ID,
				} ),
			} );
		};
		await setAnalyticsExistingPropertyId( EXISTING_PROPERTY_ID );
		await proceedToSetUpAnalytics();

		await page.waitForResponse( ( res ) => res.url().match( 'modules/analytics/data/accounts-properties-profiles' ) );
		await expect( page ).toMatchElement( '.googlesitekit-setup-module--analytics p', { text: new RegExp( `An existing analytics tag was found on your site with the id ${ EXISTING_PROPERTY_ID }`, 'i' ) } );

		await expect( page ).toMatchElement( '.mdc-select--disabled .mdc-select__selected-text', { text: /test account a/i } );
		await expect( page ).toMatchElement( '.mdc-select--disabled .mdc-select__selected-text', { text: /test property x/i } );
		await expect( page ).toMatchElement( '.mdc-select:not(.mdc-select--disabled) .mdc-select__selected-text', { text: /test profile x/i } );

		// Ensure that Views dropdown is not disabled
		await expect( page ).toClick( '.mdc-select', { text: /test profile x/i } );
		await expect( page ).toClick( '.mdc-menu-surface--open .mdc-list-item', { text: /test profile x/i } );

		await Promise.all( [
			expect( page ).toClick( 'button', { text: /configure analytics/i } ),
			page.waitForSelector( '.googlesitekit-publisher-win__title' ),
		] );

		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Analytics!/i } );
	} );

	it( 'does not allow Analytics to be set up with an existing tag that does not match a property of the user', async () => {
		getAccountsRequestHandler = ( request ) => {
			request.respond( {
				status: 500,
				body: JSON.stringify( {
					code: 'google_analytics_existing_tag_permission',
					message: 'google_analytics_existing_tag_permission',
				} ),
			} );
		};

		await proceedToSetUpAnalytics();

		await expect( page ).toMatchElement( '.googlesitekit-setup-module--analytics p', { text: /google_analytics_existing_tag_permission/i } );
		await expect( page ).not.toMatchElement( '.googlesitekit-setup-module--analytics button', { text: /create an account/i } );
		await expect( page ).not.toMatchElement( '.googlesitekit-setup-module--analytics button', { text: /re-fetch my account/i } );
	} );
} );

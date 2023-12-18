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
	setAnalyticsExistingPropertyID,
	setAuthToken,
	setClientConfig,
	setSearchConsoleProperty,
	setSiteVerification,
	useRequestInterception,
} from '../../../utils';

async function proceedToSetUpAnalytics() {
	await Promise.all( [
		expect( page ).toClick( '.googlesitekit-cta-link', {
			text: /set up analytics/i,
		} ),
		page.waitForSelector( '.googlesitekit-setup-module--analytics' ),
		page.waitForResponse( ( res ) =>
			res.url().match( 'analytics-4/data/account-summaries' )
		),
	] );
}

const existingTag = {
	accountID: '99999999',
	propertyID: 'G-99999999',
};

describe( 'setting up the Analytics module with no existing account and with an existing tag', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().match( 'analytics-4/data/account-summaries' ) ) {
				request.respond( {
					status: 200,
					body: JSON.stringify( {} ),
				} );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await activatePlugin( 'e2e-tests-analytics-existing-tag' );
		await activatePlugin(
			'e2e-tests-module-setup-analytics-api-mock-no-account'
		);

		await setClientConfig();
		await setAuthToken();
		await setSiteVerification();
		await setSearchConsoleProperty();

		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar' );
		await expect( page ).toClick( '.mdc-tab', {
			text: /connect more services/i,
		} );
		await page.waitForSelector(
			'.googlesitekit-settings-connect-module--analytics'
		);
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'allows Analytics to be set up with an existing tag that does not match a property of the user', async () => {
		await setAnalyticsExistingPropertyID( existingTag.propertyID );

		await proceedToSetUpAnalytics();

		// User should see the "create account" page.
		await expect( page ).toMatchElement(
			'.googlesitekit-setup-module--analytics button',
			{
				text: /create account/i,
			}
		);
	} );
} );

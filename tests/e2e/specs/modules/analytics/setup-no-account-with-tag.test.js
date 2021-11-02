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
			res.url().match( 'analytics/data/accounts-properties-profiles' )
		),
	] );
}

const existingTag = {
	accountID: '999',
	propertyID: 'UA-999-9',
};

describe( 'setting up the Analytics module with no existing account and with an existing tag', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if (
				request.url().match( 'modules/analytics/data/tag-permission' )
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify( {
						...existingTag,
						permission: false,
					} ),
				} );
			} else if (
				request.url().match( 'analytics-4/data/account-summaries' )
			) {
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

	it( 'does not allow Analytics to be set up with an existing tag that does not match a property of the user', async () => {
		await setAnalyticsExistingPropertyID( existingTag.propertyID );

		await proceedToSetUpAnalytics();

		await expect( page ).toMatchElement( '.googlesitekit-error-text', {
			text: /your account doesn't seem to have access to this Analytics property/i,
		} );
		// Buttons to proceed are not displayed; the user is blocked from completing setup.
		await expect( page ).not.toMatchElement(
			'.googlesitekit-setup-module--analytics button',
			{
				text: /configure analytics/i,
			}
		);
		await expect( page ).not.toMatchElement(
			'.googlesitekit-setup-module--analytics button',
			{
				text: /create an account/i,
			}
		);
		await expect( page ).not.toMatchElement(
			'.googlesitekit-setup-module--analytics button',
			{
				text: /re-fetch my account/i,
			}
		);
	} );
} );

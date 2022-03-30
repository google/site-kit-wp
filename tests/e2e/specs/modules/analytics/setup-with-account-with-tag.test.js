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
import * as fixtures from '../../../../../assets/js/modules/analytics-4/datastore/__fixtures__';

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

let tagPermissionRequestHandler = ( request ) =>
	// eslint-disable-next-line no-console
	console.warn( 'Unhandled tag permission!', request.continue() );

describe( 'setting up the Analytics module with an existing account and existing tag', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if (
				request
					.url()
					.match( 'modules/analytics/data/tag-permission' ) &&
				tagPermissionRequestHandler
			) {
				tagPermissionRequestHandler( request );
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics'
					)
			) {
				request.respond( { status: 200, body: JSON.stringify( {} ) } );
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
					)
			) {
				request.respond( { status: 200, body: JSON.stringify( {} ) } );
			} else if (
				request
					.url()
					.match(
						'/wp-json/google-site-kit/v1/modules/analytics/data/report?'
					)
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify( [] ),
				} );
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/analytics-4/data/create-property'
					)
			) {
				request.respond( {
					body: JSON.stringify( fixtures.createProperty ),
					status: 200,
				} );
			} else if (
				request.url().match( 'analytics-4/data/create-webdatastream' )
			) {
				request.respond( {
					body: JSON.stringify( fixtures.createWebDataStream ),
					status: 200,
				} );
			} else if (
				request
					.url()
					.match( 'google-site-kit/v1/modules/analytics/data/goals' )
			) {
				request.respond( { status: 200, body: JSON.stringify( {} ) } );
			} else if ( request.url().match( 'analytics-4/data/properties' ) ) {
				request.respond( {
					status: 200,
					body: JSON.stringify( [] ),
				} );
			}

			if ( ! request._interceptionHandled ) {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await activatePlugin( 'e2e-tests-analytics-existing-tag' );
		await activatePlugin( 'e2e-tests-module-setup-analytics-api-mock' );

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

	it( 'pre-selects account and property if an existing tag is found that matches one belonging to the user and prevents them from being changed', async () => {
		const existingTag = {
			accountID: '100',
			propertyID: 'UA-100-1',
		};
		tagPermissionRequestHandler = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( {
					...existingTag,
					permission: true,
				} ),
			} );
		};
		await setAnalyticsExistingPropertyID( existingTag.propertyID );
		await proceedToSetUpAnalytics();

		await expect( page ).toMatchElement(
			'.googlesitekit-setup-module--analytics p',
			{
				text: new RegExp(
					`An existing Universal Analytics tag was found on your site with the ID ${ existingTag.propertyID }`,
					'i'
				),
			}
		);

		await expect(
			page
		).toMatchElement(
			'.googlesitekit-analytics__select-account .mdc-select__selected-text',
			{ text: /test account a/i }
		);
		await expect(
			page
		).toMatchElement(
			'.googlesitekit-analytics__select-property .mdc-select__selected-text',
			{ text: /test property x/i }
		);
		await expect(
			page
		).toMatchElement(
			'.googlesitekit-analytics__select-profile .mdc-select__selected-text',
			{ text: /test profile x/i }
		);

		// Ensure that Views dropdown is not disabled
		await expect( page ).toClick( '.mdc-select', {
			text: /test profile x/i,
		} );
		await expect( page ).toClick(
			'.mdc-menu-surface--open .mdc-list-item',
			{ text: /test profile x/i }
		);

		await expect( page ).toClick( 'button', {
			text: /configure analytics/i,
		} );

		await page.waitForSelector(
			'.googlesitekit-publisher-win--win-success'
		);
		await expect( page ).toMatchElement(
			'.googlesitekit-publisher-win__title',
			{
				text: /Congrats on completing the setup for Analytics!/i,
			}
		);
	} );

	it( 'does not allow Analytics to be set up with an existing tag that does not match a property of the user', async () => {
		const existingTag = {
			accountID: '999',
			propertyID: 'UA-999-9',
		};
		tagPermissionRequestHandler = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( {
					...existingTag,
					permission: false,
				} ),
			} );
		};

		await setAnalyticsExistingPropertyID( existingTag.propertyID );
		await proceedToSetUpAnalytics();

		await expect( page ).toMatchElement( '.googlesitekit-error-text', {
			text: /your account doesn't seem to have access to this Analytics property/i,
		} );
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

	it( 'does allow Analytics to be set up with an existing tag if it is a GA4 tag', async () => {
		const existingTag = {
			accountID: '99999999',
			propertyID: 'G-99999999',
		};
		tagPermissionRequestHandler = ( request ) => {
			request.respond( {
				status: 200,
				body: JSON.stringify( {
					...existingTag,
					permission: false,
				} ),
			} );
		};

		await setAnalyticsExistingPropertyID( existingTag.propertyID );
		await proceedToSetUpAnalytics();

		await expect( page ).toMatchElement( 'p', {
			text: /An existing Google Analytics 4 tag was found on your site with the ID/i,
		} );

		await expect( page ).toClick( 'button', {
			text: /configure analytics/i,
		} );

		await page.waitForSelector(
			'.googlesitekit-publisher-win--win-success'
		);
		await expect( page ).toMatchElement(
			'.googlesitekit-publisher-win__title',
			{
				text: /Congrats on completing the setup for Analytics!/i,
			}
		);
	} );
} );

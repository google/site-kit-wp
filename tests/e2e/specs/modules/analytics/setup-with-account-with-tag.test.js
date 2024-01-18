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
			res.url().match( 'analytics-4/data/account-summaries' )
		),
	] );
}

describe( 'setting up the Analytics module with an existing account and existing tag', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			const measurementID = 'G-500';
			const containerMock = fixtures.containerE2E[ measurementID ];

			if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics'
					)
			) {
				request.respond( { status: 200, body: JSON.stringify( [] ) } );
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
						'/wp-json/google-site-kit/v1/modules/analytics-4/data/report?'
					)
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify( {} ),
				} );
			} else if (
				request.url().match( 'analytics-4/data/conversion-events' )
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
					.match( 'analytics-4/data/enhanced-measurement-settings' )
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify(
						fixtures.defaultEnhancedMeasurementSettings
					),
				} );
			} else if (
				request.url().match( 'analytics-4/data/google-tag-settings' )
			) {
				request.respond( {
					body: JSON.stringify( fixtures.googleTagSettings ),
					status: 200,
				} );
			} else if (
				request.url().match( 'analytics-4/data/container-lookup' )
			) {
				request.respond( {
					body: JSON.stringify( containerMock ),
					status: 200,
				} );
			} else if ( request.url().match( 'analytics-4/data/property' ) ) {
				request.respond( {
					body: JSON.stringify( fixtures.properties[ 0 ] ),
					status: 200,
				} );
			} else if (
				request.url().match( 'analytics-4/data/sync-custom-dimensions' )
			) {
				request.respond( {
					status: 200,
					body: '[]',
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
					body: JSON.stringify( fixtures.properties ),
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

	it( 'informs about an existing tag that matches the current selected property', async () => {
		const existingTag = {
			accountID: '100', // Test Account A
			propertyID: 'G-500',
		};
		await setAnalyticsExistingPropertyID( existingTag.propertyID );
		await proceedToSetUpAnalytics();

		await expect( page ).toMatchElement(
			'.googlesitekit-setup-module--analytics p',
			{
				text: new RegExp(
					`A tag ${ existingTag.propertyID } for the selected property already exists on the site`,
					'i'
				),
			}
		);

		await expect( page ).toMatchElement(
			'.googlesitekit-analytics__select-account .mdc-select__selected-text',
			{ text: /example com/i }
		);
		await expect( page ).toMatchElement(
			'.googlesitekit-analytics-4__select-property .mdc-select__selected-text',
			{ text: /example property/i }
		);
		await expect( page ).toMatchElement(
			'.googlesitekit-analytics-4__select-webdatastream .mdc-select__selected-text',
			{ text: /test ga4 webdatastream/i }
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

	it( 'does allow Analytics to be set up with an existing tag if it is a GA4 tag', async () => {
		const existingTag = {
			accountID: '99999999',
			propertyID: 'G-99999999',
		};

		await setAnalyticsExistingPropertyID( existingTag.propertyID );
		await proceedToSetUpAnalytics();

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

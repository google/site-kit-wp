/**
 * WordPress dependencies
 */
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	createWaitForFetchRequests,
	deactivateUtilityPlugins,
	resetSiteKit,
	setAnalyticsExistingPropertyID,
	setAuthToken,
	setClientConfig,
	setSearchConsoleProperty,
	setSiteVerification,
	step,
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

async function assertSetupSuccessful() {
	await step( 'see setup success notification', async () => {
		// While a 10s wait has not been observed, the default 5s timeout often failed here.
		await page.waitForSelector( '.googlesitekit-notice__title', {
			timeout: 10_000,
		} );
		await expect( page ).toMatchElement( '.googlesitekit-notice__title', {
			text: /Congrats on completing the setup for Analytics!/i,
		} );
	} );
}

function getRequestResponseMappings() {
	const measurementID = 'G-500';
	const containerMock = fixtures.containerE2E[ measurementID ];

	// Analytics 4 responses.
	const analyticsResponses = {
		'analytics-4/data/report': {
			status: 200,
			body: JSON.stringify( {} ),
		},
		'analytics-4/data/key-events': {
			status: 200,
			body: JSON.stringify( [] ),
		},
		'analytics-4/data/create-property': {
			status: 200,
			body: JSON.stringify( fixtures.createProperty ),
		},
		'analytics-4/data/create-webdatastream': {
			status: 200,
			body: JSON.stringify( fixtures.createWebDataStream ),
		},
		'analytics-4/data/enhanced-measurement-settings': {
			status: 200,
			body: JSON.stringify( fixtures.defaultEnhancedMeasurementSettings ),
		},
		'analytics-4/data/google-tag-settings': {
			status: 200,
			body: JSON.stringify( fixtures.googleTagSettings ),
		},
		'analytics-4/data/container-lookup': {
			status: 200,
			body: JSON.stringify( containerMock ),
		},
		'analytics-4/data/property': {
			status: 200,
			body: JSON.stringify( fixtures.properties[ 0 ] ),
		},
		'analytics-4/data/sync-custom-dimensions': {
			status: 200,
			body: '[]',
		},
		'analytics-4/data/properties': {
			status: 200,
			body: JSON.stringify( fixtures.properties ),
		},
	};

	// Search Console responses.
	const searchConsoleResponses = {
		'google-site-kit/v1/modules/search-console/data/searchanalytics': {
			status: 200,
			body: JSON.stringify( [] ),
		},
	};

	// PageSpeed Insights responses.
	const pageSpeedResponses = {
		'google-site-kit/v1/modules/pagespeed-insights/data/pagespeed': {
			status: 200,
			body: JSON.stringify( {} ),
		},
	};

	// Audience settings responses.
	const audienceSettingsResponses = {
		'user/data/audience-settings': {
			status: 200,
			body: JSON.stringify( {
				configuredAudiences: [ fixtures.availableAudiences[ 2 ].name ],
				isAudienceSegmentationWidgetHidden: false,
			} ),
		},
	};

	// Legacy Analytics responses.
	const legacyAnalyticsResponses = {
		'google-site-kit/v1/modules/analytics/data/goals': {
			status: 200,
			body: JSON.stringify( {} ),
		},
	};

	return {
		...analyticsResponses,
		...searchConsoleResponses,
		...pageSpeedResponses,
		...audienceSettingsResponses,
		...legacyAnalyticsResponses,
	};
}

describe( 'setting up the Analytics module with an existing account and existing tag', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( getRequestResponseMappings() );
	} );

	let waitForFetchRequests;

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
			'.googlesitekit-settings-connect-module--analytics-4'
		);

		waitForFetchRequests = createWaitForFetchRequests();
	} );

	afterEach( async () => {
		await page.waitForNetworkIdle( { timeout: 15_000 } );
		await waitForFetchRequests();

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

		await expect( page ).toClick( 'button:not([disabled])', {
			text: /complete setup/i,
		} );

		await assertSetupSuccessful();
	} );

	it( 'does allow Analytics to be set up with an existing tag if it is a GA4 tag', async () => {
		const existingTag = {
			accountID: '99999999',
			propertyID: 'G-99999999',
		};

		await setAnalyticsExistingPropertyID( existingTag.propertyID );
		await proceedToSetUpAnalytics();

		await expect( page ).toClick( 'button:not([disabled])', {
			text: /complete setup/i,
		} );

		await assertSetupSuccessful();
	} );
} );

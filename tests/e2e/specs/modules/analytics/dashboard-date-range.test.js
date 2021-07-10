
/**
 * WordPress dependencies
 */
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';
import { getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	pageWait,
	setSiteVerification,
	setSearchConsoleProperty,
	setupAnalytics,
	switchDateRange,
	useRequestInterception,
} from '../../../utils';
import { getAnalyticsMockResponse } from '../../../../../assets/js/modules/analytics/util/data-mock';

const datapointSelector = '.googlesitekit-data-block--sessions .googlesitekit-data-block__datapoint';

async function getTotalSessions() {
	await expect( page ).toMatchElement( datapointSelector );
	return await page.$eval( datapointSelector, ( el ) => el.textContent );
}

describe( 'date range filtering on dashboard views', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();
		await setupAnalytics();

		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			const url = request.url();
			if ( url.match( 'google-site-kit/v1/modules/analytics' ) ) {
				let response;

				if ( url.match( 'notifications' ) ) {
					response = [];
				} else {
					const query = getQueryArgs( url );
					response = getAnalyticsMockResponse( query, false );
				}

				request.respond( {
					status: 200,
					body: JSON.stringify( response ),
				} );
			} else {
				request.continue();
			}
		} );
	} );

	it( 'loads new data when the date range is changed on the module dashboard', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-module-analytics' );

		const TOTAL_SESSIONS_28_DAYS = await getTotalSessions();

		await Promise.all( [
			switchDateRange( 'last 28 days', 'last 14 days' ),
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/modules/analytics' ) ),
			page.waitForSelector( '.googlesitekit-preview-block' ),
		] );

		const TOTAL_SESSIONS_14_DAYS = await getTotalSessions();

		expect( TOTAL_SESSIONS_14_DAYS ).not.toBe( TOTAL_SESSIONS_28_DAYS );
		// Switching back will not trigger a data request as it has been cached.
		await switchDateRange( 'last 14 days', 'last 28 days' );
		// Need to wait for short time for UI to update, however no selectors/requests to listen for.
		await pageWait();
		expect( await getTotalSessions() ).toBe( TOTAL_SESSIONS_28_DAYS );
	} );
} );

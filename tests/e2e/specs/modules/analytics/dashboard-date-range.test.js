/**
 * WordPress dependencies
 */
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	setSiteVerification,
	setSearchConsoleProperty,
	setupAnalytics,
	switchDateRange,
	useRequestInterception,
} from '../../../utils';
import * as modulePageRequests from './fixtures/module-page';

let mockBatchResponse;

async function getTotalSessions() {
	const datapointSelector = '.googlesitekit-data-block--sessions .googlesitekit-data-block__datapoint';
	await expect( page ).toMatchElement( datapointSelector );
	return await page.$eval( datapointSelector, ( el ) => el.textContent );
}

describe( 'date range filtering on dashboard views', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();
		await setupAnalytics();

		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().match( 'google-site-kit/v1/data/' ) ) {
				request.respond( {
					status: 200,
					body: JSON.stringify( mockBatchResponse ),
				} );
			} else {
				request.continue();
			}
		} );
	} );

	afterEach( async () => {
		mockBatchResponse = [];
	} );

	it( 'loads new data when the date range is changed on the module dashboard', async () => {
		const { last28Days, last14Days } = modulePageRequests;

		mockBatchResponse = last28Days;
		await visitAdminPage( 'admin.php', 'page=googlesitekit-module-analytics' );
		const TOTAL_SESSIONS_28_DAYS = await getTotalSessions();

		mockBatchResponse = last14Days;
		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/data/' ) ),
			switchDateRange( 'last 28 days', 'last 14 days' ),
		] );

		const TOTAL_SESSIONS_14_DAYS = await getTotalSessions();

		expect( TOTAL_SESSIONS_14_DAYS ).not.toBe( TOTAL_SESSIONS_28_DAYS );
		// Switching back will not trigger a data request as it has been cached.
		await switchDateRange( 'last 14 days', 'last 28 days' );
		// Need to wait for short time for UI to update, however no selectors/requests to listen for.
		await page.waitFor( 250 );
		expect( await getTotalSessions() ).toBe( TOTAL_SESSIONS_28_DAYS );
	} );
} );

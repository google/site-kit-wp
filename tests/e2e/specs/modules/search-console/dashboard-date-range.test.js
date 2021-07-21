/**
 * Dashboard date range e2e tests.
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
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	pageWait,
	setSiteVerification,
	setSearchConsoleProperty,
	switchDateRange,
	useRequestInterception,
} from '../../../utils';
import * as dashboardRequests from './fixtures/dashboard';
import * as dashboardDetailsRequests from './fixtures/dashboard-details';
import * as modulePageRequests from './fixtures/module-page';

// TODO The dashboard and page dashboard still use legacy widgets
// and require legacy fixtures via calls to /data. Once they are refactored, this
// can be removed and the request interception can be brought in line with the other
// Widget API tests (see below).
let mockBatchResponse;
// TODO The module pages use the Widget API. They no longer call
// /data and receive batched responses. To make the distinction clear, these tests
// make use of this variable instead of `mockBatchResponse`. As part of
// https://github.com/google/site-kit-wp/issues/2586, this can be refactored to use
// the new getSearchConsoleMockResponse utility.
let mockResponse;

async function getTotalImpressions() {
	const datapointSelector = '.overview-total-impressions .googlesitekit-data-block__datapoint, .googlesitekit-data-block--impressions .googlesitekit-data-block__datapoint';
	await expect( page ).toMatchElement( datapointSelector );
	return await page.$eval( datapointSelector, ( el ) => el.textContent );
}

describe( 'date range filtering on dashboard views', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();

		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			const url = request.url();
			// Widget API requests. As mentioned above, these can be
			// refactored to use the mock response utility as part of
			// https://github.com/google/site-kit-wp/issues/2586.
			if ( url.match( 'google-site-kit/v1/modules/search-console' ) ) {
				request.respond( {
					status: 200,
					body: JSON.stringify( mockResponse ),
				} );
			// Legacy requests, to be removed when the dashboard and page dashboard
			// tests are refactored to use the Widget API.
			} else if ( url.match( 'google-site-kit/v1/data/' ) ) {
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

	afterAll( async () => {
		await deactivateUtilityPlugins();
	} );

	it( 'loads new data when the date range is changed on the Site Kit dashboard', async () => {
		const { last28Days, last14Days, last7DaysNoData } = dashboardRequests;

		mockBatchResponse = last28Days;
		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		const TOTAL_IMPRESSIONS_28_DAYS = await getTotalImpressions();

		mockBatchResponse = last14Days;
		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/data/' ) ),
			switchDateRange( 'last 28 days', 'last 14 days' ),
		] );

		const TOTAL_IMPRESSIONS_14_DAYS = await getTotalImpressions();

		expect( TOTAL_IMPRESSIONS_14_DAYS ).not.toBe( TOTAL_IMPRESSIONS_28_DAYS );
		// Switching back will not trigger a data request as it has been cached.
		await switchDateRange( 'last 14 days', 'last 28 days' );
		// Need to wait for short time for UI to update, however no selectors/requests to listen for.
		await pageWait();
		expect( await getTotalImpressions() ).toBe( TOTAL_IMPRESSIONS_28_DAYS );

		mockBatchResponse = last7DaysNoData;
		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/data/' ) ),
			switchDateRange( 'last 28 days', 'last 7 days' ),
		] );

		// Ensure Search Console shows no data.
		await expect( page ).toMatchElement( '.googlesitekit-cta__title', { text: /Search Console Gathering Data/i } );
	} );

	it( 'loads new data when the date range is changed on a dashboard details view for a single post', async () => {
		const { last28Days, last14Days } = dashboardDetailsRequests;

		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );
		const postSearcher = await page.$( '.googlesitekit-post-searcher' );

		await expect( postSearcher ).toFill( 'input', 'hello world' );
		await page.waitForResponse( ( res ) => res.url().match( 'core/search/data/post-search' ) );
		await expect( postSearcher ).toClick( '.autocomplete__option', { text: /hello world/i } );

		mockBatchResponse = last28Days;

		await Promise.all( [
			page.waitForNavigation(),
			expect( postSearcher ).toClick( 'button', { text: /view data/i } ),
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/data/' ) ),
		] );

		const TOTAL_IMPRESSIONS_28_DAYS = await getTotalImpressions();

		mockBatchResponse = last14Days;
		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/data/' ) ),
			switchDateRange( 'last 28 days', 'last 14 days' ),
		] );

		const TOTAL_IMPRESSIONS_14_DAYS = await getTotalImpressions();

		expect( TOTAL_IMPRESSIONS_14_DAYS ).not.toBe( TOTAL_IMPRESSIONS_28_DAYS );
		// Switching back will not trigger a data request as it has been cached.
		await switchDateRange( 'last 14 days', 'last 28 days' );
		// Need to wait for short time for UI to update, however no selectors/requests to listen for.
		await pageWait();
		expect( await getTotalImpressions() ).toBe( TOTAL_IMPRESSIONS_28_DAYS );
	} );

	it( 'loads new data when the date range is changed on the module dashboard page', async () => {
		const { last28Days, last14Days } = modulePageRequests;

		mockResponse = last28Days;
		await visitAdminPage( 'admin.php', 'page=googlesitekit-module-search-console' );

		const TOTAL_IMPRESSIONS_28_DAYS = await getTotalImpressions();

		mockResponse = last14Days;

		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/modules/search-console' ) ),
			switchDateRange( 'last 28 days', 'last 14 days' ),
		] );

		const TOTAL_IMPRESSIONS_14_DAYS = await getTotalImpressions();

		expect( TOTAL_IMPRESSIONS_14_DAYS ).not.toBe( TOTAL_IMPRESSIONS_28_DAYS );
		// Switching back will not trigger a data request as it has been cached.
		await switchDateRange( 'last 14 days', 'last 28 days' );
		// Need to wait for short time for UI to update, however no selectors/requests to listen for.
		await pageWait();
		expect( await getTotalImpressions() ).toBe( TOTAL_IMPRESSIONS_28_DAYS );
	} );
} );

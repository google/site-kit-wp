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
import * as mainDashboardRequests from './fixtures/main-dashboard';
import * as entityDashboardRequests from './fixtures/entity-dashboard';

// As part of https://github.com/google/site-kit-wp/issues/2586,
// this can be refactored to use the new getSearchConsoleMockResponse utility.
let mockResponse;

async function getTotalImpressions() {
	const datapointSelector =
		'.googlesitekit-data-block--impressions .googlesitekit-data-block__datapoint';
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
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
					)
			) {
				request.respond( { status: 200, body: JSON.stringify( {} ) } );
			} else {
				request.continue();
			}
		} );
	} );

	afterAll( async () => {
		await deactivateUtilityPlugins();
	} );

	it( 'loads new data when the date range is changed on the Site Kit dashboard', async () => {
		const { last28Days, last14Days, last7DaysNoData } =
			mainDashboardRequests;

		mockResponse = last28Days;
		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );
		await page.waitForSelector( '.googlesitekit-widget' );

		const TOTAL_IMPRESSIONS_28_DAYS = await getTotalImpressions();

		mockResponse = last14Days;
		await Promise.all( [
			page.waitForResponse( ( res ) =>
				res
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics'
					)
			),
			switchDateRange( 'last 28 days', 'last 14 days' ),
		] );

		await pageWait();
		const TOTAL_IMPRESSIONS_14_DAYS = await getTotalImpressions();

		expect( TOTAL_IMPRESSIONS_14_DAYS ).not.toBe(
			TOTAL_IMPRESSIONS_28_DAYS
		);
		// Switching back will not trigger a data request as it has been cached.
		await switchDateRange( 'last 14 days', 'last 28 days' );
		// Need to wait for short time for UI to update, however no selectors/requests to listen for.
		await pageWait();
		expect( await getTotalImpressions() ).toBe( TOTAL_IMPRESSIONS_28_DAYS );

		mockResponse = last7DaysNoData;
		await Promise.all( [
			page.waitForResponse( ( res ) =>
				res
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics'
					)
			),
			switchDateRange( 'last 28 days', 'last 7 days' ),
		] );
	} );

	it( 'loads new data when the date range is changed on an entity dashboard view for a single post', async () => {
		const { last28Days, last14Days } = entityDashboardRequests;

		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );
		const postSearcher = await page.$( '.googlesitekit-entity-search' );
		await page.click( '.googlesitekit-entity-search .mdc-button' );
		await page.waitForSelector( '.googlesitekit-entity-search__actions' );

		await expect( postSearcher ).toFill( 'input', 'hello world' );
		await page.waitForResponse( ( res ) =>
			res.url().match( 'core/search/data/entity-search' )
		);
		await expect( postSearcher ).toClick( '.autocomplete__option', {
			text: /hello world/i,
		} );

		mockResponse = last28Days;

		await Promise.all( [
			page.waitForNavigation(),
			page.waitForResponse( ( res ) =>
				res
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics'
					)
			),
		] );

		const TOTAL_IMPRESSIONS_28_DAYS = await getTotalImpressions();

		mockResponse = last14Days;
		await Promise.all( [
			page.waitForResponse( ( res ) =>
				res
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics'
					)
			),
			switchDateRange( 'last 28 days', 'last 14 days' ),
		] );

		const TOTAL_IMPRESSIONS_14_DAYS = await getTotalImpressions();

		expect( TOTAL_IMPRESSIONS_14_DAYS ).not.toBe(
			TOTAL_IMPRESSIONS_28_DAYS
		);
		// Switching back will not trigger a data request as it has been cached.
		await switchDateRange( 'last 14 days', 'last 28 days' );
		// Need to wait for short time for UI to update, however no selectors/requests to listen for.
		await pageWait();
		expect( await getTotalImpressions() ).toBe( TOTAL_IMPRESSIONS_28_DAYS );
	} );
} );

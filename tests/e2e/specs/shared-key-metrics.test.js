/**
 * User Input Settings tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * External dependencies
 */
import { set } from 'lodash';

/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	activatePlugins,
	deactivateUtilityPlugins,
	resetSiteKit,
	setupSiteKit,
	useRequestInterception,
	enableFeature,
	step,
	setSearchConsoleProperty,
	setupAnalytics,
	setupAnalytics4,
} from '../utils';
import { getAnalytics4MockResponse } from '../../../assets/js/modules/analytics-4/utils/data-mock';
import { getSearchConsoleMockResponse } from '../../../assets/js/modules/search-console/util/data-mock';
import {
	setKeyMetricsSetupCompleted,
	setKeyMetricsWidgets,
} from '../utils/key-metrics';
import {
	KM_ANALYTICS_LOYAL_VISITORS,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from '../../../assets/js/googlesitekit/datastore/user/constants';
import { setCurrentUser } from '../utils/user-mock';
import { shareModules } from '../utils/share-modules';

describe( 'Shared Key Metrics', () => {
	const widgetSlugs = [
		KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
		KM_ANALYTICS_LOYAL_VISITORS,
		KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	];
	let mockUser;

	function getMultiDimensionalObjectFromParams( params ) {
		return Object.entries( params ).reduce( ( acc, [ key, value ] ) => {
			set( acc, key, value );
			return acc;
		}, {} );
	}

	beforeAll( async () => {
		await page.setRequestInterception( true );

		useRequestInterception( ( request ) => {
			const url = request.url();

			const paramsObject = Object.fromEntries(
				new URL( url ).searchParams.entries()
			);

			// Provide mock data for Analytics 4 and Search Console requests to ensure they are not in the "gathering data" state.
			if (
				url.match(
					'/google-site-kit/v1/modules/analytics-4/data/report?'
				)
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify(
						getAnalytics4MockResponse(
							// Some of the keys are nested paths e.g. `metrics[0][name]`, so we need to convert the search params to a multi-dimensional object.
							getMultiDimensionalObjectFromParams( paramsObject )
						)
					),
				} );
			} else if (
				url.match(
					'/google-site-kit/v1/modules/search-console/data/searchanalytics?'
				)
			) {
				request.respond( {
					status: 200,
					body: JSON.stringify(
						getSearchConsoleMockResponse( paramsObject )
					),
				} );
			} else if (
				url.match(
					'/google-site-kit/v1/modules/search-console/data/data-available'
				)
			) {
				request.continue();
			} else if (
				url.match(
					'/google-site-kit/v1/modules/analytics-4/data/data-available'
				)
			) {
				request.continue();
			} else if ( url.match( 'user/data/survey-timeout' ) ) {
				request.respond( { status: 200 } );
			} else if ( url.match( '/google-site-kit/v1/modules' ) ) {
				request.respond( { status: 200 } );
			} else if (
				url.match(
					'/google-site-kit/v1/core/user/data/dismissed-tours'
				)
			) {
				request.respond( { status: 200, body: '[]' } );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await enableFeature( 'userInput' );
		await enableFeature( 'ga4Reporting' );
		await activatePlugins(
			'e2e-tests-proxy-setup',
			'e2e-tests-oauth-callback-plugin',
			'e2e-tests-share-modules-mock',
			'e2e-tests-key-metrics-setup-api-mock',
			'e2e-tests-user-mock'
		);
		// await setSearchConsoleProperty();
		await page.setRequestInterception( true );

		if ( ! mockUser ) {
			await shareModules(
				[ 'analytics-4', 'search-console' ],
				[ 'editor' ]
			);
			mockUser = 999;
		}
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'should show shared metrics tour to user if other user already did initial setup of key metrics', async () => {
		await setupSiteKit();
		await page.setRequestInterception( false );
		await setupAnalytics();
		await setupAnalytics4();
		await page.setRequestInterception( true );
		await setSearchConsoleProperty();

		await setKeyMetricsWidgets( widgetSlugs );
		await setKeyMetricsSetupCompleted( 1 );

		await step(
			'visit admin dashboard',
			visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' )
		);

		// Shared key metrics tour should not appear to the admin that did initial setup of key metrics.
		await expect( page ).not.toMatchElement(
			'.googlesitekit-tooltip-content',
			{
				text: new RegExp(
					'Another admin has set up these tailored metrics for your site.',
					'i'
				),
			}
		);

		// Set current user to mocked one, to cause mismatch in current user id
		// and keyMetricsSetupCompletedByUserID, which will trigger shared key metrics tour
		await setCurrentUser( mockUser, 'editor' );

		// Reload the page, so that mocked user can be temporarily applied
		await page.reload();

		await page.waitForSelector( '.googlesitekit-tooltip-content' );

		await expect( page ).toMatchElement( '.googlesitekit-tooltip-content', {
			text: new RegExp(
				'Another admin has set up these tailored metrics for your site.',
				'i'
			),
		} );
	} );
} );

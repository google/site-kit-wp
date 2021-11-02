/**
 * `modules/pagespeed-insights` data store: manually-enabled tests.
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { MODULES_PAGESPEED_INSIGHTS } from './constants';
import {
	createTestRegistry,
	subscribeUntil,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';

describe( 'modules/pagespeed-insights manually-enabled', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'fetchGetManuallyEnabled', () => {
			it( 'fetches and returns a manually enabled as response', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/pagespeed-insights\/data\/manually-enabled/,
					{ body: true, status: 200 }
				);

				const { response } = await registry
					.dispatch( MODULES_PAGESPEED_INSIGHTS )
					.fetchGetManuallyEnabled();

				expect( response ).toEqual( true );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getManuallyEnabled', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/pagespeed-insights\/data\/manually-enabled/,
					{ body: true, status: 200 }
				);

				const initialManualEnabled = registry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getManuallyEnabled();

				// Ensure the proper parameters were passed.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/pagespeed-insights\/data\/manually-enabled/
				);

				expect( initialManualEnabled ).toEqual( undefined );
				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_PAGESPEED_INSIGHTS )
						.hasFinishedResolution( 'getManuallyEnabled' )
				);

				const report = registry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getManuallyEnabled();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( report ).toEqual( true );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/pagespeed-insights\/data\/manually-enabled/,
					{ body: response, status: 500 }
				);

				registry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getManuallyEnabled();
				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_PAGESPEED_INSIGHTS )
						.hasFinishedResolution( 'getManuallyEnabled' )
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const report = registry
					.select( MODULES_PAGESPEED_INSIGHTS )
					.getManuallyEnabled();
				expect( report ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );

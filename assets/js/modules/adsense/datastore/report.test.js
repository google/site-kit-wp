/**
 * `modules/adsense` data store: report tests.
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
import { MODULES_ADSENSE } from './constants';
import {
	createTestRegistry,
	subscribeUntil,
	untilResolved,
} from '../../../../../tests/js/utils';
import { getAdSenseMockResponse } from '../util/data-mock';

describe( 'modules/adsense report', () => {
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

	describe( 'actions', () => {} );

	describe( 'selectors', () => {
		describe( 'getReport', () => {
			const options = {
				startDate: '2021-07-01',
				endDate: '2021-07-28',
				metrics: [ 'IMPRESSIONS' ],
				dimensions: [ 'DATE' ],
			};

			it( 'uses a resolver to make a network request', async () => {
				const report = getAdSenseMockResponse( options );

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/report'
					),
					{ body: report }
				);

				expect(
					registry.select( MODULES_ADSENSE ).getReport( options )
				).toBeUndefined();
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ADSENSE )
							.getReport( options ) !== undefined
				);

				expect(
					registry.select( MODULES_ADSENSE ).getReport( options )
				).toEqual( report );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'does not make a network request if report for given options is already present', async () => {
				const report = getAdSenseMockResponse( options );

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetReport( report, { options } );

				const initialReport = registry
					.select( MODULES_ADSENSE )
					.getReport( options );
				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ADSENSE )
						.hasFinishedResolution( 'getReport', [ options ] )
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( initialReport ).toEqual( report );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/report'
					),
					{ body: response, status: 500 }
				);

				registry.select( MODULES_ADSENSE ).getReport( options );
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ADSENSE )
							.isFetchingGetReport( options ) === false
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const report = registry
					.select( MODULES_ADSENSE )
					.getReport( options );
				expect( report ).toEqual( undefined );

				await untilResolved( registry, MODULES_ADSENSE ).getReport(
					options
				);
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );

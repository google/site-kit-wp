/**
 * dataAPI request functions tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import dataAPI from './index';
import * as Tracking from '../../util/api';
import * as DateRange from '../../util/date-range.js';
import { getCacheKey } from './cache';

describe( 'googlesitekit.dataAPI', () => {
	let trackEventSpy;

	beforeEach( () => {
		trackEventSpy = jest.spyOn( Tracking, 'trackAPIError' );
	} );

	afterEach( async () => {
		trackEventSpy.mockRestore();
	} );

	describe( 'get', () => {
		const get = dataAPI.get.bind( dataAPI );

		it( 'should call trackEvent when an error is returned on get', async () => {
			const errorResponse = {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			};

			fetchMock.getOnce(
				/^\/google-site-kit\/v1\/core\/search-console\/data\/users/,
				{ body: errorResponse, status: 500 }
			);

			try {
				get( 'core', 'search-console', 'users' );
			} catch ( err ) {
				expect( console ).toHaveErrored();
				expect( trackEventSpy ).toHaveBeenCalledWith(
					'GET',
					'users',
					'core',
					'search-console', { code: 'internal_server_error',
						data: { status: 500 },
						message: 'Internal server error' }
				);
			}
		} );
	} );

	describe( 'set', () => {
		const set = dataAPI.set.bind( dataAPI );

		it( 'should call trackEvent when an error is returned on set', async () => {
			const errorResponse = {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			};

			fetchMock.postOnce(
				/^\/google-site-kit\/v1\/core\/search-console\/data\/settings/,
				{ body: errorResponse, status: 500 }
			);

			try {
				set( 'core', 'search-console', 'settings', 'data' );
			} catch ( err ) {
				expect( console ).toHaveErrored();
				expect( trackEventSpy ).toHaveBeenCalledWith(
					'POST',
					'settings',
					'core',
					'search-console', { code: 'internal_server_error',
						data: { status: 500 },
						message: 'Internal server error' }
				);
			}
		} );
	} );

	describe( 'combinedGet', () => {
		const combinedGet = dataAPI.combinedGet.bind( dataAPI );

		const slugMock = jest.spyOn( DateRange, 'getCurrentDateRangeSlug' );
		slugMock.mockImplementation( () => 'last-28-days' );

		const combinedRequest = [
			{
				type: 'core',
				identifier: 'search-console',
				datapoint: 'users',
				data: { status: 500 },
			},
			{
				type: 'core',
				identifier: 'search-console',
				datapoint: 'search',
				data: { status: 500 },
			},
			{
				type: 'core',
				identifier: 'search-console',
				datapoint: 'other',
				data: { status: 500 },
			},

		];

		it( 'should not call trackEvent for no errors in combinedGet', async () => {
			fetchMock.postOnce(
				/^\/google-site-kit\/v1\/data/,
				{ body: {}, status: 200 }
			);

			combinedGet( combinedRequest );
			expect( console ).not.toHaveErrored();
			expect( trackEventSpy ).not.toHaveBeenCalled();
		} );

		it( 'should call trackEvent for error in combinedGet with one error', async () => {
			const cacheKey = getCacheKey( 'core', 'search-console', 'users', { dateRange: 'last-28-days', status: 500 } );
			fetchMock.postOnce(
				/^\/google-site-kit\/v1\/data/,
				{
					body:
						{
							[ cacheKey ]: {
								code: 'internal_server_error',
								message: 'Internal server error',
								data: {
									reason: 'internal_server_error',
									status: 500,
								},
							},

						},
					status: 200,
				}
			);

			combinedGet( combinedRequest );
			expect( trackEventSpy ).toHaveBeenCalledWith(
				'POST',
				'settings',
				'core',
				'search-console', { code: 'internal_server_error',
					data: { status: 500 },
					message: 'Internal server error' }
			);
		} );

		it( 'should call trackEvent for each error in combinedGet with multiple errors', async () => {

		} );
		it( 'should call trackEvent for each error in combinedGet with all errors', async () => {

		} );
	} );
} );

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
import * as Tracking from '../../util/tracking/';
import { DATA_LAYER } from '../../util/tracking/constants';
import createTracking from '../../util/tracking/createTracking';
import * as DateRange from '../../util/date-range.js';
import { getCacheKey } from './cache';

describe( 'googlesitekit.dataAPI', () => {
	let trackEventSpy;
	let pushArgs;
	const dataLayer = {
		[ DATA_LAYER ]: {
			push: ( ...args ) => pushArgs = [ ...pushArgs, ...args ],
		},
	};
	const config = {
		trackingEnabled: true,
	};
	const { trackEvent } = createTracking( config, dataLayer );
	beforeEach( () => {
		pushArgs = [];

		// Replace the trackEvent implementation to use our version with the mocked dataLayer.
		trackEventSpy = jest.spyOn( Tracking, 'trackEvent' ).mockImplementation( trackEvent );
	} );

	afterEach( async () => {
		trackEventSpy.mockRestore();
	} );

	afterAll( () => jest.restoreAllMocks() );

	const errorResponse = {
		code: 'internal_server_error',
		message: 'Internal server error',
		data: { status: 500 },
	};
	describe( 'get', () => {
		const get = dataAPI.get.bind( dataAPI );

		it( 'should call trackEvent when an error is returned on get', async () => {
			fetchMock.getOnce(
				/^\/google-site-kit\/v1\/core\/search-console\/data\/users/,
				{ body: errorResponse, status: 500 }
			);

			try {
				get( 'core', 'search-console', 'users' );
			} catch ( err ) {
				expect( console ).toHaveErrored();
				expect( pushArgs.length ).toEqual( 1 );
				const [ event, eventName, eventData ] = pushArgs[ 0 ];
				expect( event ).toEqual( 'event' );
				expect( eventName ).toEqual( 'GET:users/core/data/search-console' );
				expect( eventData.event_category ).toEqual( 'api_error' );
				expect( eventData.event_label ).toEqual( 'Internal server error (code: internal_server_error)' );
				expect( eventData.event_value ).toEqual( 500 );
			}
		} );
	} );

	describe( 'set', () => {
		const set = dataAPI.set.bind( dataAPI );

		it( 'should call trackEvent when an error is returned on set', async () => {
			fetchMock.postOnce(
				/^\/google-site-kit\/v1\/core\/search-console\/data\/settings/,
				{ body: errorResponse, status: 500 }
			);

			try {
				set( 'core', 'search-console', 'settings', 'data' );
			} catch ( err ) {
				expect( console ).toHaveErrored();
				expect( pushArgs.length ).toEqual( 1 );
				const [ event, eventName, eventData ] = pushArgs[ 0 ];
				expect( event ).toEqual( 'event' );
				expect( eventName ).toEqual( 'POST:users/core/data/search-console' );
				expect( eventData.event_category ).toEqual( 'api_error' );
				expect( eventData.event_label ).toEqual( 'Internal server error (code: internal_server_error)' );
				expect( eventData.event_value ).toEqual( 500 );
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
				identifier: 'analytics',
				datapoint: 'query',
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
			expect( pushArgs.length ).toEqual( 0 );
		} );

		it( 'should call trackEvent for error in combinedGet with one error', async () => {
			const cacheKey = getCacheKey( 'core', 'search-console', 'users', { dateRange: 'last-28-days', status: 500 } );
			const response = {
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
			};

			fetchMock.post(
				/^\/google-site-kit\/v1\/data/,
				response
			);

			await combinedGet( combinedRequest );
			expect( console ).not.toHaveErrored();
			expect( pushArgs.length ).toEqual( 1 );
			const [ event, eventName, eventData ] = pushArgs[ 0 ];
			expect( event ).toEqual( 'event' );
			expect( eventName ).toEqual( 'POST:core/search-console/data/users' );
			expect( eventData.event_category ).toEqual( 'api_error' );
			expect( eventData.event_label ).toEqual( 'Internal server error (code: internal_server_error, reason: internal_server_error)' );
			expect( eventData.event_value ).toEqual( 500 );
		} );

		it( 'should call trackEvent for each error in combinedGet with multiple errors', async () => {
			const cacheKey = getCacheKey( 'core', 'search-console', 'users', { dateRange: 'last-28-days', status: 500 } );
			const cacheKey2 = getCacheKey( 'core', 'analytics', 'query', { dateRange: 'last-28-days', status: 500 } );
			const response = {
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
						[ cacheKey2 ]: {
							code: 'unknown_error',
							message: 'Unknown error',
							data: {
								reason: 'unknown_error',
								status: 503,
							},
						},
					},
				status: 200,
			};

			fetchMock.post(
				/^\/google-site-kit\/v1\/data/,
				response
			);
			await combinedGet( combinedRequest );
			expect( console ).not.toHaveErrored();
			//
			//expect( console ).not.toHaveErrored();
			expect( pushArgs.length ).toEqual( 2 );
			let [ event, eventName, eventData ] = pushArgs[ 0 ];
			expect( event ).toEqual( 'event' );
			expect( eventName ).toEqual( 'POST:core/search-console/data/users' );
			expect( eventData.event_category ).toEqual( 'api_error' );
			expect( eventData.event_label ).toEqual( 'Internal server error (code: internal_server_error, reason: internal_server_error)' );
			expect( eventData.event_value ).toEqual( 500 );
			[ event, eventName, eventData ] = pushArgs[ 1 ];
			expect( event ).toEqual( 'event' );
			expect( eventName ).toEqual( 'POST:core/analytics/data/query' );
			expect( eventData.event_category ).toEqual( 'api_error' );
			expect( eventData.event_label ).toEqual( 'Unknown error (code: unknown_error, reason: unknown_error)' );
			expect( eventData.event_value ).toEqual( 503 );
		} );
	} );
} );

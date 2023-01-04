/**
 * `modules/analytics-4` data store: containers tests.
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
 * Internal dependencies
 */
// import API from 'googlesitekit-api';
import {
	createTestRegistry,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics-4 containers', () => {
	let registry;

	const containerLookupEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/container-lookup'
	);

	// beforeAll( () => {
	// 	API.setUsingCache( false );
	// } );

	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty settings to prevent unexpected fetch by resolver.
		// registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	// afterAll( () => {
	// 	API.setUsingCache( true );
	// } );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getGoogleTagContainer', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( containerLookupEndpoint, {
					body: fixtures.container,
					status: 200,
				} );

				const initialContainer = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainer( 'G-2C8N8YQ1L7' );
				expect( initialContainer ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getGoogleTagContainer( 'G-2C8N8YQ1L7' );
				expect( fetchMock ).toHaveFetched( containerLookupEndpoint );

				const container = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainer( 'G-2C8N8YQ1L7' );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( container ).toEqual( fixtures.container );
			} );

			it( 'should not make a network request if containers for this measurementID are already present', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetGoogleTagContainer( fixtures.container, {
						measurementID: 'G-2C8N8YQ1L7',
					} );

				const container = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainer( 'G-2C8N8YQ1L7' );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getGoogleTagContainer( 'G-2C8N8YQ1L7' );

				expect( fetchMock ).not.toHaveFetched(
					containerLookupEndpoint
				);
				expect( container ).toEqual( fixtures.container );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( containerLookupEndpoint, {
					body: response,
					status: 500,
				} );

				registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainer( 'G-2C8N8YQ1L7' );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getGoogleTagContainer( 'G-2C8N8YQ1L7' );
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const container = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagContainer( 'G-2C8N8YQ1L7' );
				expect( container ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );

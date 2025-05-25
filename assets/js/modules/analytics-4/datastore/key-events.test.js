/**
 * `modules/analytics-4` data store: key events tests.
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
import { setUsingCache } from 'googlesitekit-api';
import { MODULES_ANALYTICS_4 } from './constants';
import {
	createTestRegistry,
	subscribeUntil,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics-4 key-events', () => {
	let registry;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'selectors', () => {
		describe( 'getKeyEvents', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/key-events'
					),
					{ body: fixtures.conversionEvents }
				);

				const initialKeyEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getKeyEvents();

				expect( initialKeyEvents ).toBeUndefined();

				const keyEvents = await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getKeyEvents();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( keyEvents ).toEqual( fixtures.conversionEvents );
			} );

			it( 'does not make a network request if key events are already present', async () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetKeyEvents( fixtures.conversionEvents, {} );

				const keyEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getKeyEvents();

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ANALYTICS_4 )
						.hasFinishedResolution( 'getKeyEvents', [] )
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( keyEvents ).toEqual( fixtures.conversionEvents );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/key-events'
					),
					{ body: response, status: 500 }
				);

				await registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getKeyEvents();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const keyEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getKeyEvents();
				expect( keyEvents ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );

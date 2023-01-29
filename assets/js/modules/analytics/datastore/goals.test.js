/**
 * `modules/analytics` data store: goals tests.
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
import { MODULES_ANALYTICS } from './constants';
import {
	createTestRegistry,
	subscribeUntil,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics goals', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'selectors', () => {
		describe( 'getGoals', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/goals'
					),
					{ body: fixtures.goals, status: 200 }
				);

				const initialGoals = registry
					.select( MODULES_ANALYTICS )
					.getGoals();

				expect( initialGoals ).toBeUndefined();

				const goals = await registry
					.resolveSelect( MODULES_ANALYTICS )
					.getGoals();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( goals ).toEqual( fixtures.goals );
			} );

			it( 'does not make a network request if goals are already present', async () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetGoals( fixtures.goals );

				const goals = registry.select( MODULES_ANALYTICS ).getGoals();

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ANALYTICS )
						.hasFinishedResolution( 'getGoals', [] )
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( goals ).toEqual( fixtures.goals );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/goals'
					),
					{ body: response, status: 500 }
				);

				await registry.resolveSelect( MODULES_ANALYTICS ).getGoals();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const goals = registry.select( MODULES_ANALYTICS ).getGoals();
				expect( goals ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );

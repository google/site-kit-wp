/**
 * `core/user` data store: expirable items tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { CORE_USER } from './constants';
import { createTestRegistry } from '../../../../../tests/js/utils';
import fetchMock from 'fetch-mock';

describe( 'core/user expirable-items', () => {
	const fetchExpirableItem = new RegExp(
		'^/google-site-kit/v1/core/user/data/set-expirable-item-timers'
	);

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'expirableItem', () => {
			it( 'should save settings and return new expirable items', async () => {
				fetchMock.postOnce( fetchExpirableItem, {
					body: [ { foo: 1000 }, { bar: 2000 }, { baz: 700 } ],
				} );

				await registry.dispatch( CORE_USER ).setExpirableItemTimers( [
					{
						slug: 'baz',
						expiresInSeconds: 700,
					},
				] );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( fetchExpirableItem, {
					body: {
						data: [
							{
								slug: 'baz',
								expiration: 700,
							},
						],
					},
				} );

				const expirableItems = registry
					.select( CORE_USER )
					.getExpirableItems();

				expect( expirableItems ).toEqual( [
					{ foo: 1000 },
					{ bar: 2000 },
					{ baz: 700 },
				] );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( fetchExpirableItem, {
					body: response,
					status: 500,
				} );

				const args = [
					{
						slug: 'baz',
						expiresInSeconds: 700,
					},
				];

				await registry
					.dispatch( CORE_USER )
					.setExpirableItemTimers( args );

				expect(
					registry
						.select( CORE_USER )
						.getErrorForAction( 'expirableItems', [ args ] )
				).toMatchObject( response );

				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );

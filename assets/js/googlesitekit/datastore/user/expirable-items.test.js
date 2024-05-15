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
import {
	createTestRegistry,
	muteFetch,
	untilResolved,
} from '../../../../../tests/js/utils';
import fetchMock from 'fetch-mock';

describe( 'core/user expirable-items', () => {
	const fetchGetExpiredItems = new RegExp(
		'^/google-site-kit/v1/core/user/data/expirable-items'
	);

	const fetchExpirableItem = new RegExp(
		'^/google-site-kit/v1/core/user/data/set-expirable-item-timers'
	);

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'setExpirableItemTimers', () => {
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
						.getErrorForAction( 'setExpirableItemTimers', [ args ] )
				).toMatchObject( response );

				expect( console ).toHaveErrored();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getExpirableItems', () => {
			it( 'should return undefined until resolved', async () => {
				muteFetch( fetchGetExpiredItems, [] );
				expect(
					registry.select( CORE_USER ).getExpirableItems()
				).toBeUndefined();
				await untilResolved( registry, CORE_USER ).getExpirableItems();
			} );

			it( 'should return expirable items received from API', async () => {
				fetchMock.getOnce( fetchGetExpiredItems, {
					body: [ { foo: 1000, bar: 2000 } ],
				} );

				const expirableItems = registry
					.select( CORE_USER )
					.getExpirableItems();
				expect( expirableItems ).toBeUndefined();

				await untilResolved( registry, CORE_USER ).getExpirableItems();

				expect(
					registry.select( CORE_USER ).getExpirableItems()
				).toEqual( [ { foo: 1000, bar: 2000 } ] );
				expect( fetchMock ).toHaveFetched();
			} );

			it( 'should throw an error', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( fetchGetExpiredItems, {
					body: response,
					status: 500,
				} );

				const expirableItems = registry
					.select( CORE_USER )
					.getExpirableItems();
				expect( expirableItems ).toBeUndefined();

				await untilResolved( registry, CORE_USER ).getExpirableItems();

				registry.select( CORE_USER ).getExpirableItems();

				const error = registry
					.select( CORE_USER )
					.getErrorForSelector( 'getExpirableItems' );
				expect( error ).toMatchObject( response );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isExpirableItemActive', () => {
			it( 'should return undefined if getExpirableItems selector is not resolved yet', async () => {
				fetchMock.getOnce( fetchGetExpiredItems, { body: [] } );
				const isItemActive = registry
					.select( CORE_USER )
					.isExpirableItemActive( 'foo' );
				expect( isItemActive ).toBeUndefined();
				await untilResolved( registry, CORE_USER ).getExpirableItems();
			} );
		} );

		it( 'should return TRUE if the item has not expired', () => {
			const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

			registry.dispatch( CORE_USER ).receiveGetExpirableItems( {
				foo: currentTimeInSeconds + 100,
				bar: currentTimeInSeconds - 100,
			} );

			const isItemActive = registry
				.select( CORE_USER )
				.isExpirableItemActive( 'foo' );

			expect( isItemActive ).toBe( true );
		} );

		it( 'should return FALSE if the item has expired', () => {
			const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

			registry.dispatch( CORE_USER ).receiveGetExpirableItems( {
				foo: currentTimeInSeconds + 100,
				bar: currentTimeInSeconds - 100,
			} );

			const isItemActive = registry
				.select( CORE_USER )
				.isExpirableItemActive( 'bar' );

			expect( isItemActive ).toBe( false );
		} );

		it( 'should return FALSE if the item is not in expirables', () => {
			const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

			registry.dispatch( CORE_USER ).receiveGetExpirableItems( {
				foo: currentTimeInSeconds - 100,
				bar: currentTimeInSeconds - 100,
			} );

			const isItemActive = registry
				.select( CORE_USER )
				.isExpirableItemActive( 'baz' );

			expect( isItemActive ).toBe( false );
		} );
	} );

	describe( 'hasExpirableItem', () => {
		it( 'should return TRUE if the item is not in expirables', () => {
			const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

			registry.dispatch( CORE_USER ).receiveGetExpirableItems( {
				foo: currentTimeInSeconds + 100,
				bar: currentTimeInSeconds + 100,
			} );

			const itemExists = registry
				.select( CORE_USER )
				.isExpirableItemActive( 'foo' );

			expect( itemExists ).toBe( true );
		} );

		it( 'should return FALSE if the item is not in expirables', () => {
			const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

			registry.dispatch( CORE_USER ).receiveGetExpirableItems( {
				foo: currentTimeInSeconds - 100,
				bar: currentTimeInSeconds - 100,
			} );

			const itemExists = registry
				.select( CORE_USER )
				.isExpirableItemActive( 'baz' );

			expect( itemExists ).toBe( false );
		} );
	} );
} );

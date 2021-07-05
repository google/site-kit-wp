/**
 * `core/user` data store: dismissed items tests.
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
import { STORE_NAME } from './constants';
import { createTestRegistry, muteFetch, untilResolved } from '../../../../../tests/js/utils';

describe( 'core/user dismissed-items', () => {
	const fetchGetDismissedItems = /^\/google-site-kit\/v1\/core\/user\/data\/dismissed-items/;
	const fetchDismissItem = /^\/google-site-kit\/v1\/core\/user\/data\/dismiss-item/;

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'dismissItem', () => {
			it( 'should save settings and return new dismissed items', async () => {
				fetchMock.postOnce( fetchDismissItem, { body: [ 'foo', 'bar', 'baz' ] } );

				await registry.dispatch( STORE_NAME ).dismissItem( 'baz' );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( fetchDismissItem, {
					body: {
						data: {
							slug: 'baz',
						},
					},
				} );

				const dismissedItems = registry.select( STORE_NAME ).getDismissedItems();
				expect( dismissedItems ).toEqual( [ 'foo', 'bar', 'baz' ] );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( fetchDismissItem, {
					body: response,
					status: 500,
				} );

				await registry.dispatch( STORE_NAME ).dismissItem( 'baz' );
				expect( registry.select( STORE_NAME ).getErrorForAction( 'dismissItem', [ 'baz' ] ) ).toMatchObject( response );
				expect( console ).toHaveErrored();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getDismissedItems', () => {
			it( 'should return undefined util resolved', () => {
				muteFetch( fetchGetDismissedItems, [] );
				expect( registry.select( STORE_NAME ).getDismissedItems() ).toBeUndefined();
			} );

			it( 'should return dismissed items received from API', async () => {
				fetchMock.getOnce( fetchGetDismissedItems, { body: [ 'foo', 'bar' ] } );

				const dismissedItems = registry.select( STORE_NAME ).getDismissedItems();
				expect( dismissedItems ).toBeUndefined();

				await untilResolved( registry, STORE_NAME ).getDismissedItems();

				expect( registry.select( STORE_NAME ).getDismissedItems() ).toEqual( [ 'foo', 'bar' ] );
				expect( fetchMock ).toHaveFetched();
			} );

			it( 'should throw an error', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( fetchGetDismissedItems, {
					body: response,
					status: 500,
				} );

				const dismissedItems = registry.select( STORE_NAME ).getDismissedItems();
				expect( dismissedItems ).toBeUndefined();

				await untilResolved( registry, STORE_NAME ).getDismissedItems();

				registry.select( STORE_NAME ).getDismissedItems();

				const error = registry.select( STORE_NAME ).getErrorForSelector( 'getDismissedItems' );
				expect( error ).toMatchObject( response );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isItemDismissed', () => {
			it( 'should return undefined if getDismissedItems selector is not resolved yet', () => {
				fetchMock.getOnce( fetchGetDismissedItems, { body: [] } );
				expect( registry.select( STORE_NAME ).isItemDismissed( 'foo' ) ).toBeUndefined();
			} );

			it( 'should return TRUE if the item is dismissed', () => {
				registry.dispatch( STORE_NAME ).receiveGetDismissedItems( [ 'foo', 'bar' ] );
				expect( registry.select( STORE_NAME ).isItemDismissed( 'foo' ) ).toBe( true );
			} );

			it( 'should return FALSE if the item is not dismissed', () => {
				registry.dispatch( STORE_NAME ).receiveGetDismissedItems( [ 'foo', 'bar' ] );
				expect( registry.select( STORE_NAME ).isItemDismissed( 'baz' ) ).toBe( false );
			} );
		} );
	} );
} );

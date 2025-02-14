/**
 * `core/site` data store: client side cache tests.
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
import {
	createTestRegistry,
	untilResolved,
} from '../../../../../tests/js/utils';
import * as cacheAPI from '../../../googlesitekit/api/cache';
import { CORE_SITE } from './constants';

describe( 'core/site client side cache', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		beforeEach( async () => {
			await cacheAPI.clearCache();
		} );

		describe( 'setCacheItem', () => {
			const cacheItemKey = 'cache-set-key';

			it( 'requires `key` param', async () => {
				await expect( async () => {
					await registry.dispatch( CORE_SITE ).setCacheItem();
				} ).rejects.toThrow( 'key is required' );
			} );

			it( 'requires `value` param', async () => {
				await expect( async () => {
					await registry.dispatch( CORE_SITE ).setCacheItem( 'key' );
				} ).rejects.toThrow( 'value is required' );
			} );

			it( 'sets cache item', async () => {
				const initialResult = await cacheAPI.getItem( cacheItemKey );

				expect( initialResult.cacheHit ).toEqual( false );
				expect( initialResult.value ).toEqual( undefined );

				await registry
					.dispatch( CORE_SITE )
					.setCacheItem( cacheItemKey, 'value', {
						timestamp: Date.now(),
					} );

				const result = await cacheAPI.getItem( cacheItemKey );

				expect( result.cacheHit ).toEqual( true );
				expect( result.value ).toEqual( 'value' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		let getItemSpy;

		beforeEach( async () => {
			await cacheAPI.clearCache();

			getItemSpy = jest.spyOn( cacheAPI, 'getItem' );
		} );

		afterEach( () => {
			getItemSpy.mockReset();
		} );

		describe( 'getCacheItem', () => {
			const cacheItemKey = 'cache-item';

			it( 'uses a resolver to retrieves the data', async () => {
				await registry
					.dispatch( CORE_SITE )
					.setCacheItem( cacheItemKey, 'value', {
						timestamp: Date.now(),
					} );

				const initialResult = registry
					.select( CORE_SITE )
					.getCacheItem( cacheItemKey );

				expect( initialResult ).toEqual( undefined );

				await untilResolved( registry, CORE_SITE ).getCacheItem(
					cacheItemKey
				);

				const result = registry
					.select( CORE_SITE )
					.getCacheItem( cacheItemKey );

				expect( result.cacheHit ).toEqual( true );
				expect( result.value ).toEqual( 'value' );
				expect( getItemSpy ).toHaveBeenCalled();
			} );

			it( 'does not use a resolver if data is already in the state', () => {
				registry.dispatch( CORE_SITE ).receiveCacheItem( cacheItemKey, {
					cacheHit: true,
					value: 'value',
				} );

				const result = registry
					.select( CORE_SITE )
					.getCacheItem( cacheItemKey );

				expect( getItemSpy ).not.toHaveBeenCalled();

				expect( result.cacheHit ).toEqual( true );
				expect( result.value ).toEqual( 'value' );
			} );
		} );
	} );
} );

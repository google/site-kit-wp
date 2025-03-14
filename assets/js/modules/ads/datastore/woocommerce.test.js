/**
 * `modules/ads` data store: woocommerce tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
	provideSiteInfo,
	untilResolved,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY,
	MODULES_ADS,
} from './constants';

describe( 'modules/ads woocommerce data store', () => {
	let registry;
	let store;

	beforeEach( () => {
		jest.resetModules();

		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	describe( 'actions', () => {
		describe( 'receiveWoocommerceModalCacheHit', () => {
			it( 'requires a cacheHit to be provided', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ADS )
						.receiveWoocommerceModalCacheHit()
				).toThrow( 'A cacheHit is required.' );
			} );

			it( 'sets the woocommerceModalCacheHit in the store', () => {
				const cacheItem = { cacheHit: true };
				registry
					.dispatch( MODULES_ADS )
					.receiveWoocommerceModalCacheHit( cacheItem );
				expect( store.getState().woocommerceModalCacheHit ).toEqual(
					cacheItem.cacheHit
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getWoocommerceModalCacheHit', () => {
			it( 'returns false if there is no cache key', () => {
				const woocommerceModalCacheHit = registry
					.select( MODULES_ADS )
					.getWoocommerceModalCacheHit();
				expect( woocommerceModalCacheHit ).toEqual( false );
			} );

			it( 'returns the getWoocommerceModalCacheHit cacheHit if there is cache item', () => {
				registry
					.dispatch( MODULES_ADS )
					.receiveWoocommerceModalCacheHit( true );

				expect(
					registry.select( MODULES_ADS ).getWoocommerceModalCacheHit()
				).toEqual( true );
			} );

			it( 'uses a resolver to set getWoocommerceModalCacheHit in the store if there is a value in the cache', async () => {
				await registry
					.dispatch( CORE_SITE )
					.setCacheItem(
						ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY,
						true
					);

				registry.select( MODULES_ADS ).getWoocommerceModalCacheHit();
				await untilResolved(
					registry,
					MODULES_ADS
				).getWoocommerceModalCacheHit();

				expect(
					registry.select( MODULES_ADS ).getWoocommerceModalCacheHit()
				).toBe( true );
			} );
		} );
	} );
} );

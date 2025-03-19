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
		store = registry.stores[ MODULES_ADS ].store;
		provideSiteInfo( registry );
	} );

	describe( 'actions', () => {
		describe( 'receiveIsWooCommerceRedirectModalDismissed', () => {
			it( 'requires a cacheHit to be provided', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ADS )
						.receiveIsWooCommerceRedirectModalDismissed()
				).toThrow( 'A cacheHit is required.' );
			} );

			it( 'sets the woocommerceModalDismissed in the store', () => {
				registry
					.dispatch( MODULES_ADS )
					.receiveIsWooCommerceRedirectModalDismissed( true );
				expect( store.getState().woocommerceModalDismissed ).toEqual(
					true
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isWooCommerceRedirectModalDismissed', () => {
			it( 'returns false if there is no cache key', () => {
				const woocommerceModalDismissed = registry
					.select( MODULES_ADS )
					.isWooCommerceRedirectModalDismissed();
				expect( woocommerceModalDismissed ).toEqual( false );
			} );

			it( 'returns the isWooCommerceRedirectModalDismissed cacheHit if there is cache item', () => {
				registry
					.dispatch( MODULES_ADS )
					.receiveIsWooCommerceRedirectModalDismissed( true );

				expect(
					registry
						.select( MODULES_ADS )
						.isWooCommerceRedirectModalDismissed()
				).toEqual( true );
			} );

			it( 'uses a resolver to set isWooCommerceRedirectModalDismissed in the store if there is a value in the cache', async () => {
				await registry
					.dispatch( CORE_SITE )
					.setCacheItem(
						ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY,
						true
					);

				registry
					.select( MODULES_ADS )
					.isWooCommerceRedirectModalDismissed();
				await untilResolved(
					registry,
					MODULES_ADS
				).isWooCommerceRedirectModalDismissed();

				expect(
					registry
						.select( MODULES_ADS )
						.isWooCommerceRedirectModalDismissed()
				).toBe( true );
			} );
		} );
	} );
} );

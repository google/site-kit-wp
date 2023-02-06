/**
 * `core/site` data store: registryKey tests.
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
import {
	createTestRegistry,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site registryKey', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'setRegistryKey', () => {
			it( 'requires the registryKey param', () => {
				expect( () => {
					registry.dispatch( CORE_SITE ).setRegistryKey();
				} ).toThrow( 'registryKey is required.' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		it( 'generates a registryKey if undefined', async () => {
			registry.select( CORE_SITE ).getRegistryKey();

			await untilResolved( registry, CORE_SITE ).getRegistryKey();

			expect(
				registry.select( CORE_SITE ).getRegistryKey()
			).not.toBeUndefined();
		} );

		it( 'receives and sets registryKey', async () => {
			const registryKey = 1;
			await registry.dispatch( CORE_SITE ).setRegistryKey( registryKey );

			expect( registry.select( CORE_SITE ).getRegistryKey() ).toEqual(
				registryKey
			);
		} );
	} );
} );

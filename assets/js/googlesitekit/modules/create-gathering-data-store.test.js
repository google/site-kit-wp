/**
 * Create gathering data store tests.
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
import Data from 'googlesitekit-data';
import {
	createTestRegistry,
	unsubscribeFromAll,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../tests/js/utils';
import { createGatheringDataStore } from './create-gathering-data-store';

const MODULE_SLUG = 'test-slug';
const STORE_NAME = `modules/${ MODULE_SLUG }`;

describe( 'createGatheringDataStore', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'args', () => {
		it( 'should throw an error if no module slug is provided', () => {
			expect( () => {
				createGatheringDataStore();
			} ).toThrow( 'module slug is required.' );
		} );

		it( 'should throw an error if no store name is provided', () => {
			expect( () => {
				createGatheringDataStore( MODULE_SLUG );
			} ).toThrow( 'store name is required.' );
		} );

		it( 'should throw an error if passed dataAvailable is not a boolean', () => {
			expect( () => {
				createGatheringDataStore( MODULE_SLUG, {
					storeName: STORE_NAME,
					dataAvailable: 'not a boolean',
				} );
			} ).toThrow( 'dataAvailable must be a boolean.' );
		} );

		it( 'should throw an error if determineDataAvailability is not a function', () => {
			expect( () => {
				createGatheringDataStore( MODULE_SLUG, {
					storeName: STORE_NAME,
					determineDataAvailability: 'not a function',
				} );
			} ).toThrow( 'determineDataAvailability must be a function.' );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isDataAvailableOnLoad', () => {
			it( 'should return FALSE if not passed in args', () => {
				const store = createGatheringDataStore( MODULE_SLUG, {
					storeName: STORE_NAME,
					determineDataAvailability: () => {},
				} );
				registry.registerStore( STORE_NAME, store );
				expect(
					registry.select( STORE_NAME ).isDataAvailableOnLoad()
				).toBe( false );
			} );

			it( 'should return the value passed in args', () => {
				const store = createGatheringDataStore( MODULE_SLUG, {
					storeName: STORE_NAME,
					determineDataAvailability: () => {},
					dataAvailable: true,
				} );
				registry.registerStore( STORE_NAME, store );
				expect(
					registry.select( STORE_NAME ).isDataAvailableOnLoad()
				).toBe( true );
			} );
		} );

		describe( 'isGatheringData', () => {
			let determineDataAvailability;

			beforeAll( () => {
				determineDataAvailability = jest.fn();
			} );

			beforeEach( () => {
				determineDataAvailability.mockReset();
			} );

			it( 'should return undefined if it is not resolved yet', () => {
				registry.registerStore(
					STORE_NAME,
					Data.combineStores(
						Data.commonStore,
						createGatheringDataStore( MODULE_SLUG, {
							storeName: STORE_NAME,
							determineDataAvailability,
						} )
					)
				);

				expect(
					registry.select( STORE_NAME ).isGatheringData()
				).toBeUndefined();
			} );

			it( 'should return the value of gathering data if it is set and do nothing else', async () => {
				registry.registerStore(
					STORE_NAME,
					Data.combineStores(
						Data.commonStore,
						createGatheringDataStore( MODULE_SLUG, {
							storeName: STORE_NAME,
							determineDataAvailability,
						} )
					)
				);

				await registry
					.dispatch( STORE_NAME )
					.receiveIsGatheringData( true );

				expect( registry.select( STORE_NAME ).isGatheringData() ).toBe(
					true
				);

				await waitForDefaultTimeouts();

				expect( determineDataAvailability ).not.toHaveBeenCalled();
			} );

			it( 'should return FALSE and do nothing else when data is available on load', async () => {
				registry.registerStore(
					STORE_NAME,
					Data.combineStores(
						Data.commonStore,
						createGatheringDataStore( MODULE_SLUG, {
							storeName: STORE_NAME,
							determineDataAvailability,
							dataAvailable: true,
						} )
					)
				);

				expect(
					registry.select( STORE_NAME ).isGatheringData()
				).toBeUndefined();

				await untilResolved( registry, STORE_NAME ).isGatheringData();

				expect( registry.select( STORE_NAME ).isGatheringData() ).toBe(
					false
				);

				expect( determineDataAvailability ).not.toHaveBeenCalled();
			} );

			it( 'should call determineDataAvailability to determine gathering data state when data is not available on load', async () => {
				registry.registerStore(
					STORE_NAME,
					Data.combineStores(
						Data.commonStore,
						createGatheringDataStore( MODULE_SLUG, {
							storeName: STORE_NAME,
							determineDataAvailability,
							dataAvailable: false,
						} )
					)
				);

				expect(
					registry.select( STORE_NAME ).isGatheringData()
				).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( determineDataAvailability ).toHaveBeenCalled();
			} );

			it( 'should set gathering data state and dispetch a fetch request to save it when determineDataAvailability returns TRUE', async () => {
				determineDataAvailability.mockReturnValue( true );

				registry.registerStore(
					STORE_NAME,
					Data.combineStores(
						Data.commonStore,
						createGatheringDataStore( MODULE_SLUG, {
							storeName: STORE_NAME,
							determineDataAvailability,
							dataAvailable: false,
						} )
					)
				);

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/test-slug/data/data-available'
					),
					{
						body: { dataAvailable: true },
						status: 200,
					}
				);

				expect(
					registry.select( STORE_NAME ).isGatheringData()
				).toBeUndefined();

				await untilResolved( registry, STORE_NAME ).isGatheringData();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect( registry.select( STORE_NAME ).isGatheringData() ).toBe(
					false
				);
			} );

			it( 'should set gathering data state and do nothing else when determineDataAvailability returns FALSE', async () => {
				determineDataAvailability.mockReturnValue( false );

				registry.registerStore(
					STORE_NAME,
					Data.combineStores(
						Data.commonStore,
						createGatheringDataStore( MODULE_SLUG, {
							storeName: STORE_NAME,
							determineDataAvailability,
							dataAvailable: false,
						} )
					)
				);

				expect(
					registry.select( STORE_NAME ).isGatheringData()
				).toBeUndefined();

				await untilResolved( registry, STORE_NAME ).isGatheringData();

				expect( fetchMock ).not.toHaveFetched();

				expect( registry.select( STORE_NAME ).isGatheringData() ).toBe(
					true
				);
			} );
		} );
	} );
} );

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
import { createRegistry } from '@wordpress/data';
import { combineStores, commonStore } from 'googlesitekit-data';
import {
	unsubscribeFromAll,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../tests/js/utils';
import { createGatheringDataStore } from './create-gathering-data-store';
import { createErrorStore } from '../data/create-error-store';

const MODULE_SLUG = 'test-slug';
const STORE_NAME = `modules/${ MODULE_SLUG }`;

describe( 'createGatheringDataStore', () => {
	let registry;

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

		it( 'should throw an error if selectDataAvailability is not a function', () => {
			expect( () => {
				createGatheringDataStore( MODULE_SLUG, {
					storeName: STORE_NAME,
					selectDataAvailability: 'not a function',
				} );
			} ).toThrow( 'selectDataAvailability must be a function.' );
		} );
	} );

	describe( 'actions', () => {
		let store;

		beforeEach( () => {
			registry = createRegistry();
			store = registry.registerStore(
				STORE_NAME,
				combineStores(
					createGatheringDataStore( MODULE_SLUG, {
						storeName: STORE_NAME,
						selectDataAvailability: () => {},
					} )
				)
			);
		} );

		describe( 'receiveIsGatheringData', () => {
			it( 'requires a boolean for the gathering state to receive', () => {
				expect( () =>
					registry.dispatch( STORE_NAME ).receiveIsGatheringData()
				).toThrow( 'must be a boolean' );
			} );

			it( 'receives a `true` gathering state', () => {
				expect( store.getState().gatheringData ).toBeUndefined();

				registry.dispatch( STORE_NAME ).receiveIsGatheringData( true );

				expect( store.getState().gatheringData ).toBe( true );
			} );

			it( 'receives a `false` gathering state', () => {
				expect( store.getState().gatheringData ).toBeUndefined();

				registry.dispatch( STORE_NAME ).receiveIsGatheringData( false );

				expect( store.getState().gatheringData ).toBe( false );
			} );
		} );
	} );

	describe( 'selectors', () => {
		beforeEach( () => {
			registry = createRegistry();
		} );

		describe( 'isDataAvailableOnLoad', () => {
			it( 'should return FALSE if not passed in args', () => {
				const store = createGatheringDataStore( MODULE_SLUG, {
					storeName: STORE_NAME,
					selectDataAvailability: () => {},
				} );
				registry.registerStore( STORE_NAME, store );
				expect(
					registry.select( STORE_NAME ).isDataAvailableOnLoad()
				).toBe( false );
			} );

			it( 'should return the value passed in args', () => {
				const store = createGatheringDataStore( MODULE_SLUG, {
					storeName: STORE_NAME,
					selectDataAvailability: () => {},
					dataAvailable: true,
				} );
				registry.registerStore( STORE_NAME, store );
				expect(
					registry.select( STORE_NAME ).isDataAvailableOnLoad()
				).toBe( true );
			} );
		} );

		describe( 'isGatheringData', () => {
			let selectDataAvailability;

			beforeAll( () => {
				selectDataAvailability = jest.fn();
			} );

			beforeEach( () => {
				selectDataAvailability.mockReset();
			} );

			it( 'should return undefined if it is not resolved yet', () => {
				registry.registerStore(
					STORE_NAME,
					combineStores(
						commonStore,
						createGatheringDataStore( MODULE_SLUG, {
							storeName: STORE_NAME,
							selectDataAvailability,
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
					combineStores(
						commonStore,
						createGatheringDataStore( MODULE_SLUG, {
							storeName: STORE_NAME,
							selectDataAvailability,
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

				expect( selectDataAvailability ).not.toHaveBeenCalled();
			} );

			it( 'should return FALSE and do nothing else when data is available on load', async () => {
				registry.registerStore(
					STORE_NAME,
					combineStores(
						commonStore,
						createGatheringDataStore( MODULE_SLUG, {
							storeName: STORE_NAME,
							selectDataAvailability,
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

				expect( selectDataAvailability ).not.toHaveBeenCalled();
			} );

			it( 'should call selectDataAvailability to determine gathering data state when data is not available on load', async () => {
				registry.registerStore(
					STORE_NAME,
					combineStores(
						commonStore,
						createGatheringDataStore( MODULE_SLUG, {
							storeName: STORE_NAME,
							selectDataAvailability,
							dataAvailable: false,
						} )
					)
				);

				expect(
					registry.select( STORE_NAME ).isGatheringData()
				).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( selectDataAvailability ).toHaveBeenCalled();
			} );

			it( 'should set gathering data state and dispatch a fetch request to save it when selectDataAvailability returns TRUE', async () => {
				selectDataAvailability.mockReturnValue( true );

				registry.registerStore(
					STORE_NAME,
					combineStores(
						commonStore,
						createGatheringDataStore( MODULE_SLUG, {
							storeName: STORE_NAME,
							selectDataAvailability,
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

			it( 'should set gathering data state and do nothing else when selectDataAvailability returns FALSE', async () => {
				selectDataAvailability.mockReturnValue( false );

				registry.registerStore(
					STORE_NAME,
					combineStores(
						commonStore,
						createGatheringDataStore( MODULE_SLUG, {
							storeName: STORE_NAME,
							selectDataAvailability,
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

			it( 'should set gathering data state to TRUE when selectDataAvailability returns NULL', async () => {
				selectDataAvailability.mockReturnValue( null );

				registry.registerStore(
					STORE_NAME,
					combineStores(
						commonStore,
						createErrorStore( STORE_NAME ),
						createGatheringDataStore( MODULE_SLUG, {
							storeName: STORE_NAME,
							selectDataAvailability,
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

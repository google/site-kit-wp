/**
 * Existing Tag datastore functions tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Data from 'googlesitekit-data';
import {
	createTestRegistry,
	muteConsole,
	muteFetch,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../tests/js/utils';
import { createExistingTagStore } from './create-existing-tag-store';
import { isValidPropertyID } from '../../modules/analytics/util';
import tagMatchers from '../../modules/analytics/util/tag-matchers';
import * as factories from '../../modules/analytics/datastore/__factories__';
import { STORE_NAME as CORE_SITE } from '../datastore/site/constants';

const STORE_NAME = 'test/store';

describe( 'createExistingTagStore store', () => {
	let registry;
	let store;
	const homeURL = 'http://example.com/';

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.registerStore( STORE_NAME, Data.combineStores(
			Data.commonStore,
			createExistingTagStore( 'test', 'store', {
				tagMatchers,
				isValidTag: isValidPropertyID,
				storeName: STORE_NAME,
			} )
		) );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( { homeURL } );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'STORE_NAME', () => {
		it( 'returns the correct default store name', () => {
			const storeDefinition = createExistingTagStore( 'foo', 'store', { tagMatchers: [] } );

			expect( storeDefinition.STORE_NAME ).toEqual( 'foo/store' );
		} );

		it( 'returns the given storeName when provided', () => {
			const storeDefinition = createExistingTagStore( 'foo', 'store', { storeName: 'bar/store', tagMatchers: [] } );

			expect( storeDefinition.STORE_NAME ).toEqual( 'bar/store' );
		} );
	} );

	describe( 'actions', () => {
		describe( 'fetchGetExistingTag', () => {
			it( 'does not require any params', () => {
				expect( () => {
					muteFetch();
					registry.dispatch( STORE_NAME ).fetchGetExistingTag();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveGetExistingTag', () => {
			it( 'requires the response param', () => {
				expect( () => {
					muteConsole( 'error' );
					registry.dispatch( STORE_NAME ).receiveGetExistingTag();
				} ).toThrow( 'existingTag must be a valid tag or null.' );
			} );

			it( 'receives and sets value', () => {
				const existingTag = 'UA-12345678-1';
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( existingTag );
				expect( store.getState().existingTag ).toBe( existingTag );
			} );
		} );

		describe( 'waitForExistingTag', () => {
			it( 'supports asynchronous waiting for tag', async () => {
				const expectedTag = 'UA-12345678-1';

				fetchMock.getOnce(
					{ query: { tagverify: '1' } },
					{ body: factories.generateHTMLWithTag( expectedTag ), status: 200 }
				);

				const promise = registry.dispatch( STORE_NAME ).waitForExistingTag();
				expect( registry.select( STORE_NAME ).getExistingTag() ).toBe( undefined );

				await promise;

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( registry.select( STORE_NAME ).getExistingTag() ).toBe( expectedTag );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getExistingTag', () => {
			it( 'uses a resolver to get tag', async () => {
				const expectedTag = 'UA-12345678-1';

				fetchMock.getOnce(
					{ query: { tagverify: '1' } },
					{ body: factories.generateHTMLWithTag( expectedTag ), status: 200 }
				);

				const initialExistingTag = registry.select( STORE_NAME ).getExistingTag();
				expect( initialExistingTag ).toEqual( undefined );

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				const existingTag = registry.select( STORE_NAME ).getExistingTag();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( existingTag ).toEqual( expectedTag );
			} );
		} );

		describe( 'hasExistingTag', () => {
			it( 'returns true if an existing tag exists', async () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'UA-12345678-1' );

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( hasExistingTag ).toEqual( true );
			} );

			it( 'returns false if no existing tag exists', async () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( hasExistingTag ).toEqual( false );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'returns undefined if existing tag has not been loaded yet', async () => {
				muteFetch( { query: { tagverify: '1' } } );

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				expect( hasExistingTag ).toEqual( undefined );

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );
	} );
} );

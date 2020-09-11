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
	muteFetch,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../tests/js/utils';
import { createExistingTagStore } from './create-existing-tag-store';
import { STORE_NAME as CORE_SITE } from '../datastore/site/constants';

const STORE_NAME = 'test/store';
const tagMatchers = [
	/<test-store-tag value="([^\"]+)" \/>/,
];
const generateHTMLWithTag = ( tag ) => `<html><body><test-store-tag value="${ tag }" \/></body></html>`;

describe( 'createExistingTagStore store', () => {
	let registry;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.registerStore( STORE_NAME, Data.combineStores(
			Data.commonStore,
			createExistingTagStore( {
				storeName: STORE_NAME,
				tagMatchers,
				isValidTag: ( tag ) => !! tag,
			} )
		) );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( { homeURL: 'http://example.com/' } );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
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
					registry.dispatch( STORE_NAME ).receiveGetExistingTag();
					expect( console ).toHaveErrored();
				} ).toThrow( 'existingTag must be a tag string or null.' );
			} );

			it( 'receives an empty string tag as null', () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( '' );
				expect( store.getState().existingTag ).toBe( null );
			} );

			it( 'allows custom validation for tags, and receives invalid tags as null', () => {
				const storeName = 'is-valid-tag/store';
				const isValidTag = ( tag ) => tag === 'valid-tag';
				const storeDefinition = createExistingTagStore( {
					storeName,
					tagMatchers: [],
					isValidTag,
				} );
				store = registry.registerStore( storeName, storeDefinition );

				expect( isValidTag( 'invalid-tag' ) ).toBe( false );

				registry.dispatch( storeName ).receiveGetExistingTag( 'invalid-tag' );
				expect( store.getState().existingTag ).toBe( null );

				expect( isValidTag( 'valid-tag' ) ).toBe( true );
				registry.dispatch( storeName ).receiveGetExistingTag( 'valid-tag' );
				expect( store.getState().existingTag ).toBe( 'valid-tag' );
			} );

			it( 'receives and sets value', () => {
				const existingTag = 'test-existing-tag';
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( existingTag );
				expect( store.getState().existingTag ).toBe( existingTag );
			} );
		} );

		describe( 'waitForExistingTag', () => {
			it( 'supports asynchronous waiting for tag', async () => {
				const expectedTag = 'test-tag-value';
				fetchMock.getOnce(
					{ query: { tagverify: '1' } },
					{ body: generateHTMLWithTag( expectedTag ), status: 200 }
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
				const expectedTag = 'test-tag-value';

				fetchMock.getOnce(
					{ query: { tagverify: '1' } },
					{ body: generateHTMLWithTag( expectedTag ), status: 200 }
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
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'test-existing-tag' );

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

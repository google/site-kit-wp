/**
 * Existing Tag datastore functions tests.
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
import { setUsingCache } from 'googlesitekit-api';
import { combineStores, commonStore } from 'googlesitekit-data';
import {
	createTestRegistry,
	muteFetch,
	untilResolved,
} from '../../../../tests/js/utils';
import { createExistingTagStore } from './create-existing-tag-store';
import { CORE_SITE } from '../datastore/site/constants';

const TEST_STORE = 'test/store';
const tagMatchers = [ new RegExp( '<test-store-tag value="([^"]+)" />' ) ];
const generateHTMLWithTag = ( tag ) =>
	`<html><body><test-store-tag value="${ tag }" /></body></html>`;

describe( 'createExistingTagStore store', () => {
	let registry;
	let store;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.registerStore(
			TEST_STORE,
			combineStores(
				commonStore,
				createExistingTagStore( {
					storeName: TEST_STORE,
					tagMatchers,
					isValidTag: ( tag ) => !! tag,
				} )
			)
		);
		registry
			.dispatch( CORE_SITE )
			.receiveSiteInfo( { homeURL: 'http://example.com/' } );
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'fetchGetExistingTag', () => {
			it( 'does not require any params', () => {
				expect( () => {
					muteFetch();
					registry.dispatch( TEST_STORE ).fetchGetExistingTag();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveGetExistingTag', () => {
			it( 'requires the response param', () => {
				expect( () => {
					registry.dispatch( TEST_STORE ).receiveGetExistingTag();
				} ).toThrow( 'existingTag must be a tag string or null.' );
			} );

			it( 'receives an empty string tag as null', () => {
				registry.dispatch( TEST_STORE ).receiveGetExistingTag( '' );
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

				registry
					.dispatch( storeName )
					.receiveGetExistingTag( 'invalid-tag' );
				expect( store.getState().existingTag ).toBe( null );

				expect( isValidTag( 'valid-tag' ) ).toBe( true );
				registry
					.dispatch( storeName )
					.receiveGetExistingTag( 'valid-tag' );
				expect( store.getState().existingTag ).toBe( 'valid-tag' );
			} );

			it( 'receives and sets value', () => {
				const existingTag = 'test-existing-tag';
				registry
					.dispatch( TEST_STORE )
					.receiveGetExistingTag( existingTag );
				expect( store.getState().existingTag ).toBe( existingTag );
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

				const initialExistingTag = registry
					.select( TEST_STORE )
					.getExistingTag();
				expect( initialExistingTag ).toEqual( undefined );

				await untilResolved( registry, TEST_STORE ).getExistingTag();

				const existingTag = registry
					.select( TEST_STORE )
					.getExistingTag();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( existingTag ).toEqual( expectedTag );
			} );
		} );

		describe( 'hasExistingTag', () => {
			it( 'returns true if an existing tag exists', async () => {
				registry
					.dispatch( TEST_STORE )
					.receiveGetExistingTag( 'test-existing-tag' );

				const hasExistingTag = registry
					.select( TEST_STORE )
					.hasExistingTag();

				await untilResolved( registry, TEST_STORE ).getExistingTag();

				expect( hasExistingTag ).toEqual( true );
			} );

			it( 'returns false if no existing tag exists', async () => {
				registry.dispatch( TEST_STORE ).receiveGetExistingTag( null );

				const hasExistingTag = registry
					.select( TEST_STORE )
					.hasExistingTag();

				await untilResolved( registry, TEST_STORE ).getExistingTag();

				expect( hasExistingTag ).toEqual( false );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'returns undefined if existing tag has not been loaded yet', async () => {
				muteFetch( { query: { tagverify: '1' } } );

				const hasExistingTag = registry
					.select( TEST_STORE )
					.hasExistingTag();

				expect( hasExistingTag ).toEqual( undefined );

				await untilResolved( registry, TEST_STORE ).getExistingTag();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );
	} );
} );

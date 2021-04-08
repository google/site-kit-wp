/**
 * `modules/subscribe-with-google` data store: settings tests.
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
import API from 'googlesitekit-api';
import defaultModules from '../../../googlesitekit/modules/datastore/__fixtures__';
import { createTestRegistry, muteFetch, unsubscribeFromAll } from '../../../../../tests/js/utils';
import { createCacheKey } from '../../../googlesitekit/api';
import { getItem, setItem } from '../../../googlesitekit/api/cache';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { STORE_NAME } from './constants';
import { INVARIANT_INVALID_PRODUCTS, INVARIANT_INVALID_PUBLICATION_ID } from './settings';

describe( 'modules/tagmanager settings', () => {
	let registry;

	const defaultSettings = {
		products: '',
		publicationID: '',
	};

	const validSettings = {
		products: 'news',
		publicationID: 'publisher.com',
	};

	const WPError = {
		code: 'internal_error',
		message: 'Something wrong happened.',
		data: { status: 500 },
	};

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'submitChanges', () => {
			it( 'dispatches saveSettings', async () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/subscribe-with-google\/data\/settings/,
					{ body: validSettings, status: 200 }
				);

				await registry.dispatch( STORE_NAME ).submitChanges();

				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/subscribe-with-google\/data\/settings/,
					{
						body: { data: validSettings },
					}
				);

				expect( registry.select( STORE_NAME ).haveSettingsChanged() ).toBe( false );
			} );

			it( 'returns an error if saveSettings fails', async () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/subscribe-with-google\/data\/settings/,
					{ body: WPError, status: 500 }
				);

				const result = await registry.dispatch( STORE_NAME ).submitChanges();

				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/subscribe-with-google\/data\/settings/,
					{
						body: { data: validSettings },
					}
				);
				expect( result.error ).toEqual( WPError );
				expect( console ).toHaveErrored();
			} );

			it( 'invalidates module cache on success', async () => {
				registry.dispatch( STORE_NAME ).setSettings( validSettings );

				muteFetch( /^\/google-site-kit\/v1\/modules\/subscribe-with-google\/data\/settings/ );
				const cacheKey = createCacheKey( 'modules', 'subscribe-with-google', 'arbitrary-datapoint' );
				expect( await setItem( cacheKey, 'test-value' ) ).toBe( true );
				expect( ( await getItem( cacheKey ) ).value ).not.toBeFalsy();

				await registry.dispatch( STORE_NAME ).submitChanges();

				expect( ( await getItem( cacheKey ) ).value ).toBeFalsy();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isDoingSubmitChanges', () => {
			it( 'returns true while submitting changes', async () => {
				registry.dispatch( STORE_NAME ).receiveGetSettings( validSettings );

				expect( registry.select( STORE_NAME ).haveSettingsChanged() ).toBe( false );
				expect( registry.select( STORE_NAME ).isDoingSubmitChanges() ).toBe( false );

				const promise = registry.dispatch( STORE_NAME ).submitChanges();

				expect( registry.select( STORE_NAME ).isDoingSubmitChanges() ).toBe( true );

				await promise;

				expect( registry.select( STORE_NAME ).isDoingSubmitChanges() ).toBe( false );
			} );
		} );

		describe( 'canSubmitChanges', () => {
			beforeEach( () => {
				// Preload default settings to prevent the resolver from making unexpected requests
				// as this is covered in settings store tests.
				registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );

				registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: false } );
				registry.dispatch( STORE_NAME ).setSettings( validSettings );
				registry.dispatch( CORE_MODULES ).receiveGetModules( defaultModules );
			} );

			it( 'requires a valid publicationID', () => {
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setPublicationID( '...' );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );
				expect( () => registry.select( STORE_NAME ).__dangerousCanSubmitChanges() )
					.toThrow( INVARIANT_INVALID_PUBLICATION_ID );
			} );

			it( 'requires a valid products string', () => {
				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setProducts( ' ' );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( false );
				expect( () => registry.select( STORE_NAME ).__dangerousCanSubmitChanges() )
					.toThrow( INVARIANT_INVALID_PRODUCTS );
			} );
		} );
	} );
} );

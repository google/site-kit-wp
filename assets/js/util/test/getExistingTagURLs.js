/**
 * `getExistingTag` tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import { getExistingTagURLs } from '../tag';
import { setUsingCache } from 'googlesitekit-api';
import { AMP_MODE_SECONDARY } from '../../googlesitekit/datastore/site/constants';

describe( 'modules/tagmanager existing-tag', () => {
	beforeAll( () => {
		setUsingCache( false );
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'getExistingTagURLs', () => {
		it( 'gets the home URL if AMP mode is not secondary', async () => {
			const homeURL = 'http://example.com/';
			const expectedURLs = [ homeURL ];

			fetchMock.getOnce( new RegExp( '^/wp/v2/posts' ), {
				body: [
					{ link: 'http://example.com/amp/' },
					{ link: 'http://example.com/ignore-me' },
				],
				status: 200,
			} );

			const existingTagURLs = await getExistingTagURLs( { homeURL } );

			expect( fetchMock ).not.toHaveFetched();
			expect( existingTagURLs ).toEqual( expectedURLs );
		} );

		it( 'gets the home URL and the first amp post if AMP mode is secondary', async () => {
			const homeURL = 'http://example.com/';
			const expectedURLs = [ homeURL, 'http://example.com/amp/?amp=1' ];

			fetchMock.getOnce( new RegExp( '^/wp/v2/posts' ), {
				body: [
					{ link: 'http://example.com/amp/' },
					{ link: 'http://example.com/ignore-me' },
				],
				status: 200,
			} );

			const existingTagURLs = await getExistingTagURLs( {
				homeURL,
				ampMode: AMP_MODE_SECONDARY,
			} );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( existingTagURLs ).toEqual( expectedURLs );
		} );

		it( 'returns urls if posts API request fails', async () => {
			const homeURL = 'http://example.com/';
			const expectedURLs = [ homeURL ];

			fetchMock.getOnce( new RegExp( '^/wp/v2/posts' ), {
				throws: 'error',
			} );

			// No expect( console ).toHaveErrored() needed as the error is caught internally.
			const existingTagURLs = await getExistingTagURLs( { homeURL } );

			expect( existingTagURLs ).toEqual( expectedURLs );
		} );
	} );
} );

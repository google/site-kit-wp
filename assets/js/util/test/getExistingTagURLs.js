/**
 * util/tag getExistingTag tests.
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
import { getExistingTagURLs } from '../tag';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createTestRegistry,
	unsubscribeFromAll,
} from '../../../../tests/js/utils';
import { STORE_NAME as CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import fetchMock from 'fetch-mock';

describe( 'modules/tagmanager existing-tag', () => {
	let registry;

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

	describe( 'getExistingTagURLs', () => {
		it( 'gets the home URL if AMP mode is not secondary', async () => {
			const expectedURLs = [
				'http://example.com/',
			];

			fetchMock.getOnce(
				/^\/wp\/v2\/posts/,
				{
					body: [
						{ link: 'http://example.com/amp/' },
						{ link: 'http://example.com/ignore-me' },
					],
					status: 200,
				}
			);

			registry.dispatch( CORE_SITE ).receiveSiteInfo( { homeURL: 'http://example.com/' } );
			const coreRegistry = registry.select( CORE_SITE );

			const existingTagURLs = await getExistingTagURLs( coreRegistry );

			expect( fetchMock ).not.toHaveFetched();
			expect( existingTagURLs ).toEqual( expectedURLs );
		} );

		it( 'gets the home URL and the first amp post if AMP mode is secondary', async () => {
			const expectedURLs = [
				'http://example.com/',
				'http://example.com/amp/?amp=1',
			];

			fetchMock.getOnce(
				/^\/wp\/v2\/posts/,
				{
					body: [
						{ link: 'http://example.com/amp/' },
						{ link: 'http://example.com/ignore-me' },
					],
					status: 200,
				}
			);

			registry.dispatch( CORE_SITE ).receiveSiteInfo( { homeURL: 'http://example.com/', ampMode: 'secondary' } );
			const coreRegistry = registry.select( CORE_SITE );

			const existingTagURLs = await getExistingTagURLs( coreRegistry );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( existingTagURLs ).toEqual( expectedURLs );
		} );
	} );
} );

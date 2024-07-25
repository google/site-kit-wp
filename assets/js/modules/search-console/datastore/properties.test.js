/**
 * `modules/search-console` data store: properties tests.
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
import {
	createTestRegistry,
	untilResolved,
} from '../../../../../tests/js/utils';
import { MODULES_SEARCH_CONSOLE } from './constants';
import * as fixtures from './__fixtures__';

describe( 'modules/search-console properties', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'selectors', () => {
		describe( 'getMatchedProperties', () => {
			const endpoint = new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/matched-sites'
			);

			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce( endpoint, {
					body: fixtures.matchedProperties,
					status: 200,
				} );

				const initialProperties = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getMatchedProperties();
				expect( initialProperties ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_SEARCH_CONSOLE
				).getMatchedProperties();

				const properties = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getMatchedProperties();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( properties ).toEqual( fixtures.matchedProperties );
			} );

			it( 'does not make a network request if matched properties are already present', async () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.receiveGetMatchedProperties( fixtures.matchedProperties );

				const properties = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getMatchedProperties();

				await untilResolved(
					registry,
					MODULES_SEARCH_CONSOLE
				).getMatchedProperties();

				expect( fetchMock ).not.toHaveFetched();
				expect( properties ).toEqual( fixtures.matchedProperties );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( endpoint, {
					body: response,
					status: 500,
				} );

				registry
					.select( MODULES_SEARCH_CONSOLE )
					.getMatchedProperties();
				await untilResolved(
					registry,
					MODULES_SEARCH_CONSOLE
				).getMatchedProperties();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const properties = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getMatchedProperties();
				expect( properties ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );

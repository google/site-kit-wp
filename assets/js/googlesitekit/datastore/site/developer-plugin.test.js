/**
 * `core/site` data store, developer plugin tests.
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
	muteFetch,
	untilResolved,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site developer plugin state', () => {
	const responseDeveloperPluginState = {
		active: true,
		installed: true,
		activateURL: 'http://example.com/activate',
		installURL: 'http://example.com/install',
		configureURL: 'http://example.com/configure',
	};

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

	describe( 'actions', () => {
		it( 'does not require any params', () => {
			expect( () => {
				muteFetch(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/developer-plugin'
					)
				);
				registry.dispatch( CORE_SITE ).fetchGetDeveloperPluginState();
			} ).not.toThrow();
		} );

		describe( 'receiveGetDeveloperPluginState', () => {
			it( 'requires the response param', () => {
				expect( () => {
					registry
						.dispatch( CORE_SITE )
						.receiveGetDeveloperPluginState();
				} ).toThrow( 'response is required.' );
			} );

			it( 'receives and sets developer plugin state', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetDeveloperPluginState(
						responseDeveloperPluginState
					);

				const { developerPluginState } =
					registry.stores[ CORE_SITE ].store.getState();

				expect( developerPluginState ).toMatchObject(
					responseDeveloperPluginState
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getDeveloperPluginState', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/developer-plugin'
					),
					{ body: responseDeveloperPluginState, status: 200 }
				);

				const initialDeveloperPluginState = registry
					.select( CORE_SITE )
					.getDeveloperPluginState();
				// The developer plugin state will be its initial value while the developer plugin state is fetched.
				expect( initialDeveloperPluginState ).toEqual( undefined );
				await untilResolved(
					registry,
					CORE_SITE
				).getDeveloperPluginState();

				const developerPluginState = registry
					.select( CORE_SITE )
					.getDeveloperPluginState();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( developerPluginState ).toEqual(
					responseDeveloperPluginState
				);
			} );

			it( 'does not make a network request if data is already in state', async () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetDeveloperPluginState(
						responseDeveloperPluginState,
						{}
					);

				const developerPluginState = registry
					.select( CORE_SITE )
					.getDeveloperPluginState();

				await untilResolved(
					registry,
					CORE_SITE
				).getDeveloperPluginState();

				expect( fetchMock ).not.toHaveFetched();
				expect( developerPluginState ).toEqual(
					responseDeveloperPluginState
				);
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/developer-plugin'
					),
					{ body: response, status: 500 }
				);

				registry.select( CORE_SITE ).getDeveloperPluginState();

				await untilResolved(
					registry,
					CORE_SITE
				).getDeveloperPluginState();

				const developerPluginState = registry
					.select( CORE_SITE )
					.getDeveloperPluginState();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( developerPluginState ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );

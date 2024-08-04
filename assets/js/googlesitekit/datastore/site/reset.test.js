/**
 * `core/site` data store: reset connection tests.
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
import {
	createTestRegistry,
	subscribeUntil,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site reset', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'fetchReset', () => {
			it( 'sets isDoingReset ', () => {
				const response = true;
				fetchMock.postOnce(
					new RegExp( '^/google-site-kit/v1/core/site/data/reset' ),
					{ body: JSON.stringify( response ), status: 200 }
				);

				registry.dispatch( CORE_SITE ).fetchReset();
				expect( registry.select( CORE_SITE ).isDoingReset() ).toEqual(
					true
				);
			} );
		} );

		describe( 'reset', () => {
			it( 'does not require any params', () => {
				expect( async () => {
					const response = true;
					fetchMock.postOnce(
						new RegExp(
							'^/google-site-kit/v1/core/site/data/reset'
						),
						{ body: JSON.stringify( response ), status: 200 }
					);

					await registry.dispatch( CORE_SITE ).reset();
				} ).not.toThrow();
			} );

			it( 'resets connection on server only', async () => {
				const response = true;
				fetchMock.postOnce(
					new RegExp( '^/google-site-kit/v1/core/site/data/reset' ),
					{ body: JSON.stringify( response ), status: 200 }
				);

				registry
					.dispatch( CORE_SITE )
					.receiveGetConnection(
						{ connected: true, resettable: true },
						{}
					);

				await registry.dispatch( CORE_SITE ).reset();
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/connection'
					),
					{
						body: { connected: false, resettable: false },
						status: 200,
					}
				);

				// After a successful reset, `connection` state will be updated on the next page load.
				const connection = await registry
					.select( CORE_SITE )
					.getConnection();
				expect( connection ).toEqual( {
					connected: true,
					resettable: true,
				} );
			} );

			it( 'does not reset local connection if reset request fails', async () => {
				// Make sure there is existing data in the store so we can ensure
				// it isn't reset.
				registry
					.dispatch( CORE_SITE )
					.receiveGetConnection(
						{ connected: true, resettable: true },
						{}
					);

				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.postOnce(
					new RegExp( '^/google-site-kit/v1/core/site/data/reset' ),
					{ body: JSON.stringify( response ), status: 500 }
				);

				registry.dispatch( CORE_SITE ).reset();
				await subscribeUntil(
					registry,
					() => registry.select( CORE_SITE ).isDoingReset() === false
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				// After a failed reset, `connection` should still exist.
				const connection = registry.select( CORE_SITE ).getConnection();
				expect( connection ).toEqual( {
					connected: true,
					resettable: true,
				} );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );

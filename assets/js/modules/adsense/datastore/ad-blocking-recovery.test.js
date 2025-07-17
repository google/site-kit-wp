/**
 * `modules/adsense` data store: Ad Blocking Recovery tests.
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
import { setUsingCache } from 'googlesitekit-api';
import {
	createTestRegistry,
	muteFetch,
	untilResolved,
} from '../../../../../tests/js/utils';
import { MODULES_ADSENSE } from './constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';

describe( 'Ad Blocking Recovery Existing Tag store', () => {
	let registry;
	let store;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ MODULES_ADSENSE ].store;
		registry
			.dispatch( CORE_SITE )
			.receiveSiteInfo( { homeURL: 'http://example.com/' } );
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'fetchGetExistingAdBlockingRecoveryTag', () => {
			it( 'does not require any params', () => {
				expect( () => {
					muteFetch();
					registry
						.dispatch( MODULES_ADSENSE )
						.fetchGetExistingAdBlockingRecoveryTag();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveGetExistingAdBlockingRecoveryTag', () => {
			it( 'requires the response param', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ADSENSE )
						.receiveGetExistingAdBlockingRecoveryTag();
				} ).toThrow(
					'existingAdBlockingRecoveryTag must be a tag string or null.'
				);
			} );

			it( 'receives an empty string tag as null', () => {
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetExistingAdBlockingRecoveryTag( '' );
				expect( store.getState().existingAdBlockingRecoveryTag ).toBe(
					null
				);
			} );

			it( 'receives and sets value', () => {
				const existingAdBlockingRecoveryTag = 'pub-12345678';
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetExistingAdBlockingRecoveryTag(
						existingAdBlockingRecoveryTag
					);
				expect( store.getState().existingAdBlockingRecoveryTag ).toBe(
					existingAdBlockingRecoveryTag
				);
			} );
		} );

		describe( 'syncAdBlockingRecoveryTags', () => {
			it( 'dispatches an error if the request fails', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/sync-ad-blocking-recovery-tags'
					),
					{ body: errorResponse, status: 500 }
				);

				const { response, error } = await registry
					.dispatch( MODULES_ADSENSE )
					.syncAdBlockingRecoveryTags();

				expect( error ).toEqual( errorResponse );
				expect( response ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'fetches and returns success status', async () => {
				const syncSyncAdBlockingRecoveryTagssResponse = {
					success: true,
				};

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/sync-ad-blocking-recovery-tags'
					),
					{
						body: syncSyncAdBlockingRecoveryTagssResponse,
						status: 200,
					}
				);

				const { response, error } = await registry
					.dispatch( MODULES_ADSENSE )
					.syncAdBlockingRecoveryTags();

				expect( error ).toEqual( undefined );
				expect( response ).toEqual(
					syncSyncAdBlockingRecoveryTagssResponse
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getExistingAdBlockingRecoveryTag', () => {
			it( 'returns null if no existing ad blocking recovery tag exists', async () => {
				fetchMock.getOnce(
					{ query: { tagverify: '1' } },
					{
						body: `
				    <html>
				        <head></head>
				        <body>
				            <script async src="https://example.google.com/" nonce="ZKHXgPoIEALtt7HHGBdjgh">
				            </script>
				        </body>
				    </html>
				`,
					}
				);

				registry
					.select( MODULES_ADSENSE )
					.getExistingAdBlockingRecoveryTag();

				await untilResolved(
					registry,
					MODULES_ADSENSE
				).getExistingAdBlockingRecoveryTag();

				expect(
					registry
						.select( MODULES_ADSENSE )
						.getExistingAdBlockingRecoveryTag()
				).toBeNull();
			} );

			it( 'gets the correct ad blocking recovery tag', async () => {
				const expectedTag = 'pub-12345678';

				fetchMock.getOnce(
					{ query: { tagverify: '1' } },
					{
						body: `
				    <html>
				        <head></head>
				        <body>
				            <script async src="https://fundingchoicesmessages.google.com/i/pub-12345678?ers=1" nonce="ZKHXgPoIEALtt7HHGBdjgh">
				            </script>
				        </body>
				    </html>
				`,
					}
				);

				registry
					.select( MODULES_ADSENSE )
					.getExistingAdBlockingRecoveryTag();

				await untilResolved(
					registry,
					MODULES_ADSENSE
				).getExistingAdBlockingRecoveryTag();

				expect(
					registry
						.select( MODULES_ADSENSE )
						.getExistingAdBlockingRecoveryTag()
				).toEqual( expectedTag );
			} );
		} );

		describe( 'hasExistingAdBlockingRecoveryTag', () => {
			it( 'returns true if an existing ad blocking recovery tag exists', async () => {
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetExistingAdBlockingRecoveryTag( 'pub-12345678' );

				const hasExistingAdBlockingRecoveryTag = registry
					.select( MODULES_ADSENSE )
					.hasExistingAdBlockingRecoveryTag();

				await untilResolved(
					registry,
					MODULES_ADSENSE
				).getExistingAdBlockingRecoveryTag();

				expect( hasExistingAdBlockingRecoveryTag ).toEqual( true );
			} );

			it( 'returns false if no existing ad blocking recovery tag exists', async () => {
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetExistingAdBlockingRecoveryTag( null );

				const hasExistingAdBlockingRecoveryTag = registry
					.select( MODULES_ADSENSE )
					.hasExistingAdBlockingRecoveryTag();

				await untilResolved(
					registry,
					MODULES_ADSENSE
				).getExistingAdBlockingRecoveryTag();

				expect( hasExistingAdBlockingRecoveryTag ).toEqual( false );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'returns undefined if existing ad blocking recovery tag has not been loaded yet', async () => {
				muteFetch( { query: { tagverify: '1' } } );

				const hasExistingAdBlockingRecoveryTag = registry
					.select( MODULES_ADSENSE )
					.hasExistingAdBlockingRecoveryTag();

				expect( hasExistingAdBlockingRecoveryTag ).toEqual( undefined );

				await untilResolved(
					registry,
					MODULES_ADSENSE
				).getExistingAdBlockingRecoveryTag();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );
	} );
} );

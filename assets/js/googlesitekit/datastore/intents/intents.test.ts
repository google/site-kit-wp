/**
 * `core/intents` data store: intents tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	freezeFetch,
	untilResolved,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { CORE_INTENTS } from './constants';

describe( 'core/intents', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'getIntent', () => {
		it( 'returns the intent from the `core/intents/data/intent` route for the slug and the one-time code', async () => {
			fetchMock.getOnce(
				new RegExp( '^/google-site-kit/v1/core/intents/data/intent' ),
				{
					body: {
						intent: 'ads-conversion-tracking',
						created: '2026-07-30T10:15:00Z',
						payload: {
							tag_id: 'AW-123456789',
							customer_name: 'Example Store',
							consent_date: '2026-07-28',
						},
					},
				}
			);

			registry
				.select( CORE_INTENTS )
				.getIntent( 'ads-conversion-tracking', 'abc123' );
			await untilResolved( registry, CORE_INTENTS ).getIntent(
				'ads-conversion-tracking',
				'abc123'
			);

			expect( fetchMock ).toHaveFetched(
				new RegExp( '^/google-site-kit/v1/core/intents/data/intent' ),
				{
					query: {
						slug: 'ads-conversion-tracking',
						intent_code: 'abc123',
					},
				}
			);
			expect(
				registry
					.select( CORE_INTENTS )
					.getIntent( 'ads-conversion-tracking', 'abc123' )
			).toEqual( {
				intent: 'ads-conversion-tracking',
				created: '2026-07-30T10:15:00Z',
				payload: {
					tag_id: 'AW-123456789',
					customer_name: 'Example Store',
					consent_date: '2026-07-28',
				},
			} );
		} );

		it( 'returns `undefined` when the intent is still loading', async () => {
			freezeFetch(
				new RegExp( '^/google-site-kit/v1/core/intents/data/intent' )
			);

			registry
				.select( CORE_INTENTS )
				.getIntent( 'ads-conversion-tracking', 'abc123' );
			await waitForDefaultTimeouts();

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect(
				registry
					.select( CORE_INTENTS )
					.getIntent( 'ads-conversion-tracking', 'abc123' )
			).toBeUndefined();
		} );

		it( 'requests the intent again when the next page loads', async () => {
			fetchMock.getOnce(
				new RegExp( '^/google-site-kit/v1/core/intents/data/intent' ),
				{
					body: {
						intent: 'ads-conversion-tracking',
						created: '2026-07-30T10:15:00Z',
						payload: {
							tag_id: 'AW-123456789',
							customer_name: 'Example Store',
							consent_date: '2026-07-28',
						},
					},
				}
			);
			fetchMock.getOnce(
				new RegExp( '^/google-site-kit/v1/core/intents/data/intent' ),
				{
					body: {
						code: 'intent_not_found',
						message:
							'This link can’t be used. Go back to where you started and try again.',
						data: { status: 404 },
					},
					status: 404,
				}
			);

			registry
				.select( CORE_INTENTS )
				.getIntent( 'ads-conversion-tracking', 'abc123' );
			await untilResolved( registry, CORE_INTENTS ).getIntent(
				'ads-conversion-tracking',
				'abc123'
			);

			// The next page load gets a new registry, so only the cache that
			// `googlesitekit-api` keeps in session storage could return the
			// earlier response.
			const nextPageRegistry = createTestRegistry();

			nextPageRegistry
				.select( CORE_INTENTS )
				.getIntent( 'ads-conversion-tracking', 'abc123' );
			await untilResolved( nextPageRegistry, CORE_INTENTS ).getIntent(
				'ads-conversion-tracking',
				'abc123'
			);

			expect( fetchMock ).toHaveFetchedTimes( 2 );
			expect(
				nextPageRegistry
					.select( CORE_INTENTS )
					.getIntent( 'ads-conversion-tracking', 'abc123' )
			).toBeUndefined();
			expect( console ).toHaveErrored();
		} );

		it( 'requests the intent again for another one-time code of the same slug', async () => {
			fetchMock.getOnce(
				new RegExp( '^/google-site-kit/v1/core/intents/data/intent' ),
				{
					body: {
						intent: 'ads-conversion-tracking',
						created: '2026-07-30T10:15:00Z',
						payload: {
							tag_id: 'AW-123456789',
							customer_name: 'Example Store',
							consent_date: '2026-07-28',
						},
					},
				}
			);
			fetchMock.getOnce(
				new RegExp( '^/google-site-kit/v1/core/intents/data/intent' ),
				{
					body: {
						intent: 'ads-conversion-tracking',
						created: '2026-07-31T08:00:00Z',
						payload: {
							tag_id: 'AW-987654321',
							customer_name: 'Example Shop',
							consent_date: '2026-07-30',
						},
					},
				}
			);

			registry
				.select( CORE_INTENTS )
				.getIntent( 'ads-conversion-tracking', 'abc123' );
			await untilResolved( registry, CORE_INTENTS ).getIntent(
				'ads-conversion-tracking',
				'abc123'
			);

			registry
				.select( CORE_INTENTS )
				.getIntent( 'ads-conversion-tracking', 'def456' );
			await untilResolved( registry, CORE_INTENTS ).getIntent(
				'ads-conversion-tracking',
				'def456'
			);

			expect( fetchMock ).toHaveFetchedTimes( 2 );
			expect( fetchMock ).toHaveFetched(
				new RegExp( '^/google-site-kit/v1/core/intents/data/intent' ),
				{
					query: {
						slug: 'ads-conversion-tracking',
						intent_code: 'def456',
					},
				}
			);
			expect(
				registry
					.select( CORE_INTENTS )
					.getIntent( 'ads-conversion-tracking', 'def456' )
			).toEqual( {
				intent: 'ads-conversion-tracking',
				created: '2026-07-31T08:00:00Z',
				payload: {
					tag_id: 'AW-987654321',
					customer_name: 'Example Shop',
					consent_date: '2026-07-30',
				},
			} );
		} );

		it( 'keeps the intent of the first one-time code when a second one-time code of the same slug loads', () => {
			registry.dispatch( CORE_INTENTS ).receiveGetIntent(
				{
					intent: 'ads-conversion-tracking',
					created: '2026-07-30T10:15:00Z',
					payload: {
						tag_id: 'AW-123456789',
						customer_name: 'Example Store',
						consent_date: '2026-07-28',
					},
				},
				{ slug: 'ads-conversion-tracking', code: 'abc123' }
			);

			registry.dispatch( CORE_INTENTS ).receiveGetIntent(
				{
					intent: 'ads-conversion-tracking',
					created: '2026-07-31T08:00:00Z',
					payload: {
						tag_id: 'AW-987654321',
						customer_name: 'Example Shop',
						consent_date: '2026-07-30',
					},
				},
				{ slug: 'ads-conversion-tracking', code: 'def456' }
			);

			expect(
				registry
					.select( CORE_INTENTS )
					.getIntent( 'ads-conversion-tracking', 'abc123' )
			).toEqual( {
				intent: 'ads-conversion-tracking',
				created: '2026-07-30T10:15:00Z',
				payload: {
					tag_id: 'AW-123456789',
					customer_name: 'Example Store',
					consent_date: '2026-07-28',
				},
			} );
			expect(
				registry
					.select( CORE_INTENTS )
					.getIntent( 'ads-conversion-tracking', 'def456' )
			).toEqual( {
				intent: 'ads-conversion-tracking',
				created: '2026-07-31T08:00:00Z',
				payload: {
					tag_id: 'AW-987654321',
					customer_name: 'Example Shop',
					consent_date: '2026-07-30',
				},
			} );
		} );

		it( 'does not request the intent when the store already has it', async () => {
			registry.dispatch( CORE_INTENTS ).receiveGetIntent(
				{
					intent: 'ads-conversion-tracking',
					created: '2026-07-30T10:15:00Z',
					payload: {
						tag_id: 'AW-123456789',
						customer_name: 'Example Store',
						consent_date: '2026-07-28',
					},
				},
				{ slug: 'ads-conversion-tracking', code: 'abc123' }
			);

			registry
				.select( CORE_INTENTS )
				.getIntent( 'ads-conversion-tracking', 'abc123' );
			await untilResolved( registry, CORE_INTENTS ).getIntent(
				'ads-conversion-tracking',
				'abc123'
			);

			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'requests the intent for a one-time code named after an inherited `Object` property', async () => {
			freezeFetch(
				new RegExp( '^/google-site-kit/v1/core/intents/data/intent' )
			);

			registry.dispatch( CORE_INTENTS ).receiveGetIntent(
				{
					intent: 'ads-conversion-tracking',
					created: '2026-07-30T10:15:00Z',
					payload: {
						tag_id: 'AW-123456789',
						customer_name: 'Example Store',
						consent_date: '2026-07-28',
					},
				},
				{ slug: 'ads-conversion-tracking', code: 'abc123' }
			);

			expect(
				registry
					.select( CORE_INTENTS )
					.getIntent( 'ads-conversion-tracking', 'constructor' )
			).toBeUndefined();

			await waitForDefaultTimeouts();

			expect( fetchMock ).toHaveFetched(
				new RegExp( '^/google-site-kit/v1/core/intents/data/intent' ),
				{
					query: {
						slug: 'ads-conversion-tracking',
						intent_code: 'constructor',
					},
				}
			);
		} );

		it( 'returns `undefined` and stores the error for `getErrorForSelector` when loading the intent fails', async () => {
			fetchMock.getOnce(
				new RegExp( '^/google-site-kit/v1/core/intents/data/intent' ),
				{
					body: {
						code: 'intent_not_found',
						message:
							'This link can’t be used. Go back to where you started and try again.',
						data: { status: 404 },
					},
					status: 404,
				}
			);

			registry
				.select( CORE_INTENTS )
				.getIntent( 'ads-conversion-tracking', 'abc123' );
			await untilResolved( registry, CORE_INTENTS ).getIntent(
				'ads-conversion-tracking',
				'abc123'
			);

			expect(
				registry
					.select( CORE_INTENTS )
					.getErrorForSelector( 'getIntent', [
						'ads-conversion-tracking',
						'abc123',
					] )
			).toEqual( {
				code: 'intent_not_found',
				message:
					'This link can’t be used. Go back to where you started and try again.',
				data: { status: 404 },
			} );
			expect(
				registry
					.select( CORE_INTENTS )
					.getIntent( 'ads-conversion-tracking', 'abc123' )
			).toBeUndefined();
			expect( console ).toHaveErrored();
		} );

		it( 'throws an error when the slug is missing', () => {
			expect( () =>
				registry.select( CORE_INTENTS ).getIntent( undefined, 'abc123' )
			).toThrow( 'slug is required.' );
		} );

		it( 'throws an error when the one-time code is missing', () => {
			expect( () =>
				registry
					.select( CORE_INTENTS )
					.getIntent( 'ads-conversion-tracking', undefined )
			).toThrow( 'code is required.' );
		} );
	} );

	describe( 'completeIntent', () => {
		it( 'returns the URL from the `core/intents/data/complete-intent` route for the slug and the one-time code', async () => {
			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/core/intents/data/complete-intent'
				),
				{
					body: {
						return_url: 'https://example.com/ads/conversions',
					},
				}
			);

			const { response, error } = await registry
				.dispatch( CORE_INTENTS )
				.completeIntent( 'ads-conversion-tracking', 'abc123' );

			expect( fetchMock ).toHaveFetched(
				new RegExp(
					'^/google-site-kit/v1/core/intents/data/complete-intent'
				),
				{
					body: {
						data: {
							slug: 'ads-conversion-tracking',
							intent_code: 'abc123',
						},
					},
				}
			);
			expect( response ).toEqual( {
				return_url: 'https://example.com/ads/conversions',
			} );
			expect( error ).toBeUndefined();
		} );

		it( 'returns the error when completing the intent fails', async () => {
			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/core/intents/data/complete-intent'
				),
				{
					body: {
						code: 'intent_not_found',
						message:
							'This link can’t be used. Go back to where you started and try again.',
						data: { status: 404 },
					},
					status: 404,
				}
			);

			const { response, error } = await registry
				.dispatch( CORE_INTENTS )
				.completeIntent( 'ads-conversion-tracking', 'abc123' );

			expect( error ).toEqual( {
				code: 'intent_not_found',
				message:
					'This link can’t be used. Go back to where you started and try again.',
				data: { status: 404 },
			} );
			expect( response ).toBeUndefined();
			expect(
				registry
					.select( CORE_INTENTS )
					.getErrorForAction( 'completeIntent', [
						'ads-conversion-tracking',
						'abc123',
					] )
			).toEqual( {
				code: 'intent_not_found',
				message:
					'This link can’t be used. Go back to where you started and try again.',
				data: { status: 404 },
			} );
			expect( console ).toHaveErrored();
		} );

		it( 'throws an error when the slug is missing', () => {
			expect( () =>
				registry
					.dispatch( CORE_INTENTS )
					.completeIntent( undefined, 'abc123' )
			).toThrow( 'slug is required.' );
		} );

		it( 'throws an error when the one-time code is missing', () => {
			expect( () =>
				registry
					.dispatch( CORE_INTENTS )
					.completeIntent( 'ads-conversion-tracking', undefined )
			).toThrow( 'code is required.' );
		} );
	} );
} );

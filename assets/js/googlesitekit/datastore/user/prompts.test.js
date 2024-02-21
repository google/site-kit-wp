/**
 * `core/user` data store: dismissed prompts tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { CORE_USER } from './constants';
import {
	createTestRegistry,
	muteFetch,
	untilResolved,
} from '../../../../../tests/js/utils';
import { stringToDate } from '../../../util';

describe( 'core/user dismissed-prompts', () => {
	const fetchGetDismissedPrompts = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismissed-prompts'
	);
	const fetchDismissPrompt = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-prompt'
	);

	const referenceDate = '2023-06-22';

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( CORE_USER ).setReferenceDate( referenceDate );
	} );

	describe( 'actions', () => {
		describe( 'dismissPrompt', () => {
			it( 'should save settings and return new dismissed prompts', async () => {
				fetchMock.postOnce( fetchDismissPrompt, {
					body: {
						foo: { expires: 0, count: 1 },
						bar: { expires: 0, count: 1 },
					},
				} );

				await registry
					.dispatch( CORE_USER )
					.dismissPrompt( 'baz', { expiresInSeconds: 3 } );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched( fetchDismissPrompt, {
					body: {
						data: {
							slug: 'baz',
							expiration: 3,
						},
					},
				} );

				const dismissedPrompts = registry
					.select( CORE_USER )
					.getDismissedPrompts();
				expect( dismissedPrompts ).toEqual( [ 'foo', 'bar' ] );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( fetchDismissPrompt, {
					body: response,
					status: 500,
				} );

				await registry.dispatch( CORE_USER ).dismissPrompt( 'baz' );
				expect(
					registry
						.select( CORE_USER )
						.getErrorForAction( 'dismissPrompt', [ 'baz', 0 ] )
				).toMatchObject( response );
				expect( console ).toHaveErrored();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getDismissedPrompts', () => {
			it( 'should return undefined until resolved', async () => {
				muteFetch( fetchGetDismissedPrompts, { body: {} } );
				expect(
					registry.select( CORE_USER ).getDismissedPrompts()
				).toBeUndefined();
				await untilResolved(
					registry,
					CORE_USER
				).getDismissedPrompts();
			} );

			it( 'should return dismissed prompts received from API', async () => {
				fetchMock.getOnce( fetchGetDismissedPrompts, {
					body: {
						foo: { expires: 0, count: 1 },
						bar: { expires: 0, count: 1 },
					},
				} );

				const dismissedPrompts = registry
					.select( CORE_USER )
					.getDismissedPrompts();
				expect( dismissedPrompts ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_USER
				).getDismissedPrompts();

				expect(
					registry.select( CORE_USER ).getDismissedPrompts()
				).toEqual( [ 'foo', 'bar' ] );
				expect( fetchMock ).toHaveFetched();
			} );

			it( 'should not return dismissed prompts once they have expired', async () => {
				const referenceDateInSeconds = Math.floor(
					stringToDate( referenceDate ).getTime() / 1000
				);

				fetchMock.getOnce( fetchGetDismissedPrompts, {
					body: {
						foo: { expires: 0, count: 1 },
						bar: {
							expires: referenceDateInSeconds + 2000,
							count: 1,
						},
						baz: {
							expires: referenceDateInSeconds - 2000,
							count: 1,
						},
					},
				} );

				const dismissedPrompts = registry
					.select( CORE_USER )
					.getDismissedPrompts();
				expect( dismissedPrompts ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_USER
				).getDismissedPrompts();

				expect(
					registry.select( CORE_USER ).getDismissedPrompts()
				).toEqual( [ 'foo', 'bar' ] );
				expect( fetchMock ).toHaveFetched();
			} );

			it( 'should throw an error', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( fetchGetDismissedPrompts, {
					body: response,
					status: 500,
				} );

				const dismissedPrompts = registry
					.select( CORE_USER )
					.getDismissedPrompts();
				expect( dismissedPrompts ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_USER
				).getDismissedPrompts();

				registry.select( CORE_USER ).getDismissedPrompts();

				const error = registry
					.select( CORE_USER )
					.getErrorForSelector( 'getDismissedPrompts' );
				expect( error ).toMatchObject( response );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getPromptDismissCount', () => {
			it( 'should return undefined until resolved', () => {
				fetchMock.getOnce( fetchGetDismissedPrompts, { body: {} } );
				expect(
					registry.select( CORE_USER ).getPromptDismissCount( 'foo' )
				).toBeUndefined();
			} );

			it( 'should return the count of the prompt', () => {
				registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
					foo: { expires: 0, count: 1 },
					bar: { expires: 0, count: 2 },
				} );
				expect(
					registry.select( CORE_USER ).getPromptDismissCount( 'foo' )
				).toBe( 1 );
				expect(
					registry.select( CORE_USER ).getPromptDismissCount( 'bar' )
				).toBe( 2 );
			} );
		} );

		describe( 'isPromptDismissed', () => {
			it( 'should return undefined if getDismissedPrompts selector is not resolved yet', async () => {
				fetchMock.getOnce( fetchGetDismissedPrompts, { body: {} } );
				expect(
					registry.select( CORE_USER ).isPromptDismissed( 'foo' )
				).toBeUndefined();
				await untilResolved(
					registry,
					CORE_USER
				).getDismissedPrompts();
			} );

			it( 'should return TRUE if the prompt is dismissed', () => {
				registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
					foo: { expires: 0, count: 1 },
					bar: { expires: 0, count: 1 },
				} );
				expect(
					registry.select( CORE_USER ).isPromptDismissed( 'foo' )
				).toBe( true );
			} );

			it( 'should return FALSE if the prompt is not dismissed', () => {
				registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
					foo: { expires: 0, count: 1 },
					bar: { expires: 0, count: 1 },
				} );
				expect(
					registry.select( CORE_USER ).isPromptDismissed( 'baz' )
				).toBe( false );
			} );
		} );

		describe( 'isDismissingPrompt', () => {
			it( 'returns true while prompt dismissal is in progress', () => {
				const slug = 'foo-bar';

				muteFetch( fetchDismissPrompt );

				expect(
					registry.select( CORE_USER ).isDismissingPrompt( slug )
				).toBe( false );

				registry.dispatch( CORE_USER ).dismissPrompt( slug );

				expect(
					registry.select( CORE_USER ).isDismissingPrompt( slug )
				).toBe( true );
			} );

			it( 'returns false while prompt dismissal is over', async () => {
				const slug = 'foo-bar';

				fetchMock.postOnce( fetchDismissPrompt, { body: [ slug ] } );

				expect(
					registry.select( CORE_USER ).isDismissingPrompt( slug )
				).toBe( false );

				await registry.dispatch( CORE_USER ).dismissPrompt( slug );

				expect(
					registry.select( CORE_USER ).isDismissingPrompt( slug )
				).toBe( false );
			} );
		} );
	} );
} );

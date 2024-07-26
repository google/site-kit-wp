/**
 * `core/user` data store: user tracking settings tests.
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
	subscribeUntil,
	untilResolved,
} from '../../../../../tests/js/utils';
import { CORE_USER } from './constants';

describe( 'core/user tracking settings', () => {
	let registry;

	const coreUserTrackingSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/tracking'
	);

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'setTrackingEnabled', () => {
			it.each( [
				[ 'enable', true ],
				[ 'disable', false ],
			] )(
				'should %s tracking and add it to the store',
				async ( status, enabled ) => {
					fetchMock.postOnce(
						coreUserTrackingSettingsEndpointRegExp,
						{
							status: 200,
							body: { enabled },
						}
					);

					await registry
						.dispatch( CORE_USER )
						.setTrackingEnabled( enabled );

					// Ensure the proper body parameters were sent.
					expect( fetchMock ).toHaveFetched(
						coreUserTrackingSettingsEndpointRegExp,
						{
							body: { data: { enabled } },
						}
					);

					expect(
						registry.select( CORE_USER ).isTrackingEnabled()
					).toBe( enabled );
					expect( fetchMock ).toHaveFetchedTimes( 1 );
				}
			);

			it( 'dispatches an error if the request fails ', async () => {
				const enabled = true;
				const args = [ enabled ];
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( coreUserTrackingSettingsEndpointRegExp, {
					body: response,
					status: 500,
				} );

				await registry
					.dispatch( CORE_USER )
					.setTrackingEnabled( ...args );
				expect(
					registry
						.select( CORE_USER )
						.getErrorForAction( 'setTrackingEnabled', args )
				).toMatchObject( response );
				expect( console ).toHaveErrored();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isTrackingEnabled', () => {
			it( 'should use a resolver to make a network request', async () => {
				const enabled = true;

				fetchMock.getOnce( coreUserTrackingSettingsEndpointRegExp, {
					status: 200,
					body: { enabled },
				} );

				const { isTrackingEnabled } = registry.select( CORE_USER );

				expect( isTrackingEnabled() ).toBeUndefined();
				await untilResolved( registry, CORE_USER ).isTrackingEnabled();

				expect( isTrackingEnabled() ).toBe( enabled );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should not make a network request if data is already in state', async () => {
				const enabled = true;

				registry
					.dispatch( CORE_USER )
					.receiveGetTracking( { enabled } );

				const tracking = registry
					.select( CORE_USER )
					.isTrackingEnabled();
				await subscribeUntil( registry, () =>
					registry
						.select( CORE_USER )
						.hasFinishedResolution( 'isTrackingEnabled' )
				);

				expect( tracking ).toEqual( enabled );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( coreUserTrackingSettingsEndpointRegExp, {
					status: 500,
					body: response,
				} );

				registry.select( CORE_USER ).isTrackingEnabled();
				await subscribeUntil( registry, () =>
					registry
						.select( CORE_USER )
						.hasFinishedResolution( 'isTrackingEnabled' )
				);

				const enabled = registry
					.select( CORE_USER )
					.isTrackingEnabled();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( enabled ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );

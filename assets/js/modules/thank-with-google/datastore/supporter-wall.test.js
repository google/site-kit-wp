/**
 * Site Kit by Google, Copyright 2022 Google LLC
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
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import { MODULES_THANK_WITH_GOOGLE } from './constants';

describe( 'modules/thank-with-google supporter-wall', () => {
	const supporterWallSidebarsEndpoint =
		/^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/supporter-wall-sidebars/;
	const supporterWallPromptEndpoint =
		/^\/google-site-kit\/v1\/modules\/thank-with-google\/data\/supporter-wall-prompt/;

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getSupporterWallSidebars', () => {
			it( 'should use a resolver to get sidebars when requested', async () => {
				fetchMock.getOnce( supporterWallSidebarsEndpoint, {
					body: [ 'Sidebar 1' ],
				} );

				// The sidebars will be `undefined` whilst loading.
				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.getSupporterWallSidebars()
				).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved(
					registry,
					MODULES_THANK_WITH_GOOGLE
				).getSupporterWallSidebars();

				const sidebars = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getSupporterWallSidebars();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( sidebars ).toEqual( [ 'Sidebar 1' ] );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( supporterWallSidebarsEndpoint, {
					body: response,
					status: 500,
				} );

				registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getSupporterWallSidebars();

				await untilResolved(
					registry,
					MODULES_THANK_WITH_GOOGLE
				).getSupporterWallSidebars();

				const sidebars = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getSupporterWallSidebars();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( sidebars ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'should not make a network request if data is already in state', () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetSupporterWallSidebars( [ 'Sidebar 2' ] );

				const sidebars = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getSupporterWallSidebars();

				expect( fetchMock ).not.toHaveFetched();
				expect( sidebars ).toEqual( [ 'Sidebar 2' ] );
			} );
		} );

		describe( 'getSupporterWallPrompt', () => {
			it( 'should use a resolver to get supporter wall prompt data when requested', async () => {
				fetchMock.getOnce( supporterWallPromptEndpoint, {
					body: { supporterWallPrompt: true },
				} );

				// The supporter wall prompt state will be `undefined` whilst loading.
				expect(
					registry
						.select( MODULES_THANK_WITH_GOOGLE )
						.getSupporterWallPrompt()
				).toBeUndefined();

				// Wait for loading to complete.
				await untilResolved(
					registry,
					MODULES_THANK_WITH_GOOGLE
				).getSupporterWallPrompt();

				const supporterWallPrompt = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getSupporterWallPrompt();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( supporterWallPrompt ).toEqual( true );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( supporterWallPromptEndpoint, {
					body: response,
					status: 500,
				} );

				registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getSupporterWallPrompt();

				await untilResolved(
					registry,
					MODULES_THANK_WITH_GOOGLE
				).getSupporterWallPrompt();

				const supporterWallPrompt = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getSupporterWallPrompt();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( supporterWallPrompt ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'should not make a network request if data is already in state', () => {
				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetSupporterWallPrompt( {
						supporterWallPrompt: true,
					} );

				const supporterWallPrompt = registry
					.select( MODULES_THANK_WITH_GOOGLE )
					.getSupporterWallPrompt();

				expect( fetchMock ).not.toHaveFetched();
				expect( supporterWallPrompt ).toEqual( true );
			} );
		} );
	} );
} );

/**
 * `modules/sign-in-with-google` data store: open user registration tests.
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
import API from 'googlesitekit-api';
import { MODULES_SIGN_IN_WITH_GOOGLE } from './constants';
import {
	createTestRegistry,
	subscribeUntil,
} from '../../../../../tests/js/utils';

describe( 'modules/sign-in-with-google anyoneCanRegister', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'selectors', () => {
		describe( 'getAnyoneCanRegister', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/sign-in-with-google/data/anyone-can-register'
					),
					{ body: { enabled: true } }
				);

				let anyoneCanRegister = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getAnyoneCanRegister();

				expect( anyoneCanRegister ).toBeUndefined();

				anyoneCanRegister = await registry
					.resolveSelect( MODULES_SIGN_IN_WITH_GOOGLE )
					.getAnyoneCanRegister();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( anyoneCanRegister ).toEqual( true );
			} );

			it( 'does not make a network request if anyoneCanRegister is already present', async () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
					.setAnyoneCanRegister( true );

				const anyoneCanRegister = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getAnyoneCanRegister();

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_SIGN_IN_WITH_GOOGLE )
						.hasFinishedResolution( 'getAnyoneCanRegister', [] )
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( anyoneCanRegister ).toEqual( true );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/sign-in-with-google/data/anyone-can-register'
					),
					{ body: response, status: 500 }
				);

				await registry
					.resolveSelect( MODULES_SIGN_IN_WITH_GOOGLE )
					.getAnyoneCanRegister();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const anyoneCanRegister = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getAnyoneCanRegister();
				expect( anyoneCanRegister ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );

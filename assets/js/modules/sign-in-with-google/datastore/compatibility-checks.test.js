/**
 * `modules/sign-in-with-google` data store: compatibility-checks tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
	untilResolved,
} from '../../../../../tests/js/utils';
import { MODULES_SIGN_IN_WITH_GOOGLE } from './constants';

describe( 'modules/sign-in-with-google compatibility-checks', () => {
	let registry;

	const compatibilityChecksFixture = [ true, false ]; // The value doesn't really matter.

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'selectors', () => {
		describe( 'getCompatibilityChecks', () => {
			const endpoint = new RegExp(
				'^/google-site-kit/v1/modules/sign-in-with-google/data/compatibility-checks'
			);

			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce( endpoint, {
					body: compatibilityChecksFixture,
					status: 200,
				} );

				const initialCompatibilityChecks = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getCompatibilityChecks();
				expect( initialCompatibilityChecks ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_SIGN_IN_WITH_GOOGLE
				).getCompatibilityChecks();

				const compatibilityChecks = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getCompatibilityChecks();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( compatibilityChecks ).toEqual(
					compatibilityChecksFixture
				);
			} );

			it( 'does not make a network request if compatibility checks are already present', async () => {
				registry
					.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
					.receiveGetCompatibilityChecks(
						compatibilityChecksFixture
					);

				const compatibilityChecks = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getCompatibilityChecks();

				await untilResolved(
					registry,
					MODULES_SIGN_IN_WITH_GOOGLE
				).getCompatibilityChecks();

				expect( fetchMock ).not.toHaveFetched();
				expect( compatibilityChecks ).toEqual(
					compatibilityChecksFixture
				);
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
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getCompatibilityChecks();
				await untilResolved(
					registry,
					MODULES_SIGN_IN_WITH_GOOGLE
				).getCompatibilityChecks();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const compatibilityChecks = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getCompatibilityChecks();
				expect( compatibilityChecks ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );

			it( 'returns undefined when no compatibility checks data is available', () => {
				const compatibilityChecks = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getCompatibilityChecks();

				expect( compatibilityChecks ).toBeUndefined();
			} );

			it( 'returns the compatibility checks data when available', () => {
				registry
					.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
					.receiveGetCompatibilityChecks(
						compatibilityChecksFixture
					);

				const compatibilityChecks = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getCompatibilityChecks();

				expect( compatibilityChecks ).toEqual(
					compatibilityChecksFixture
				);
			} );
		} );
	} );
} );

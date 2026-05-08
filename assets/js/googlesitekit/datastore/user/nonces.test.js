/**
 * `core/user` data store: Nonces info tests.
 *
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
import { createTestRegistry } from '../../../../../tests/js/utils';
import { CORE_USER } from './constants';
import fetchMock from 'fetch-mock';
import { waitFor } from '@testing-library/react';

describe( 'core/user nonces', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		it( 'should set nonces', () => {
			registry
				.dispatch( CORE_USER )
				.receiveNonces( { updates: 'testnonce' } );

			expect( registry.select( CORE_USER ).getNonces() ).toEqual( {
				updates: 'testnonce',
			} );
		} );

		it( 'should fetch nonces from api', async () => {
			const nonces = {
				updates: 'testnonce',
			};

			fetchMock.getOnce(
				/^\/google-site-kit\/v1\/core\/user\/data\/nonces/,
				{
					body: nonces,
					status: 200,
				}
			);
			registry.dispatch( CORE_USER ).fetchGetNonces();

			await waitFor( () => expect( fetchMock ).toHaveFetchedTimes( 1 ) );

			expect( registry.select( CORE_USER ).getNonces() ).toEqual( {
				updates: 'testnonce',
			} );
		} );
	} );

	describe( 'selectors', () => {
		it( 'should get all nonces', () => {
			const nonces = { updates: 'testnonce' };
			registry.dispatch( CORE_USER ).receiveNonces( nonces );

			expect( registry.select( CORE_USER ).getNonces() ).toEqual(
				nonces
			);
		} );

		it( 'should get nonce', () => {
			const nonces = { updates: 'testnonce' };
			registry.dispatch( CORE_USER ).receiveNonces( nonces );

			expect(
				registry.select( CORE_USER ).getNonce( 'updates' )
			).toEqual( nonces.updates );
		} );

		it( 'should get undefined for invalid nonce action', () => {
			const nonces = { updates: 'testnonce' };
			registry.dispatch( CORE_USER ).receiveNonces( nonces );

			expect(
				registry.select( CORE_USER ).getNonce( 'invalid_action' )
			).toBeUndefined();
		} );
	} );
} );

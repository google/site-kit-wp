/**
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
import { CORE_UI } from '../../assets/js/googlesitekit/datastore/ui/constants';
import { createTestRegistry, subscribeUntil } from './utils';

describe( 'test utilities', () => {
	describe( 'subscribeUntil', () => {
		it( 'subscribes to registry updates until predicates are satisfied', async () => {
			const registry = createTestRegistry();
			let count = 0;
			const updateRegistry = async () =>
				// async to allow await and trigger next tick
				await registry.dispatch( CORE_UI ).setValue( 'count', count++ );

			const listener = jest.fn( () => false );

			let subscribeResolved = false;
			subscribeUntil( registry, listener ).then(
				() => ( subscribeResolved = true )
			);

			expect( listener ).toHaveBeenCalledTimes( 0 );
			await updateRegistry(); // call 1
			expect( listener ).toHaveBeenCalledTimes( 1 );
			await updateRegistry(); // call 2
			expect( listener ).toHaveBeenCalledTimes( 2 );
			expect( subscribeResolved ).toBe( false );

			// Update the impl to satisfy the predicate on the next call.
			listener.mockImplementation( () => true );
			await updateRegistry(); // call 3
			expect( subscribeResolved ).toBe( true );
			expect( listener ).toHaveBeenCalledTimes( 3 );

			await updateRegistry();
			await updateRegistry();
			await updateRegistry();

			expect( listener ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'subscribes to registry updates until ALL predicates are satisfied', async () => {
			const registry = createTestRegistry();
			let count = 0;
			const updateRegistry = async () =>
				// async to allow await and trigger next tick
				await registry.dispatch( CORE_UI ).setValue( 'count', count++ );

			// eslint-disable-next-line camelcase
			const listener_a = jest.fn( () => true );
			// eslint-disable-next-line camelcase
			const listener_b = jest.fn( () => false );
			// eslint-disable-next-line camelcase
			const listener_c = jest.fn( () => false );

			let subscribeResolved = false;
			subscribeUntil( registry, listener_a, listener_b, listener_c ).then(
				() => ( subscribeResolved = true )
			);

			expect( listener_a ).toHaveBeenCalledTimes( 0 );
			expect( listener_b ).toHaveBeenCalledTimes( 0 );
			expect( listener_c ).toHaveBeenCalledTimes( 0 );
			await updateRegistry(); // call 1
			expect( subscribeResolved ).toBe( false );
			expect( listener_a ).toHaveBeenCalledTimes( 1 ); // true
			expect( listener_b ).toHaveBeenCalledTimes( 1 ); // false
			expect( listener_c ).toHaveBeenCalledTimes( 0 ); // not called (iteration stops at first false)

			listener_b.mockImplementation( () => true );
			await updateRegistry(); // call 2
			expect( subscribeResolved ).toBe( false );
			expect( listener_a ).toHaveBeenCalledTimes( 2 ); // true
			expect( listener_b ).toHaveBeenCalledTimes( 2 ); // true
			expect( listener_c ).toHaveBeenCalledTimes( 1 ); // false

			listener_c.mockImplementation( () => true );
			await updateRegistry(); // call 3
			expect( subscribeResolved ).toBe( true );
			expect( listener_a ).toHaveBeenCalledTimes( 3 ); // true
			expect( listener_b ).toHaveBeenCalledTimes( 3 ); // true
			expect( listener_c ).toHaveBeenCalledTimes( 2 ); // true

			await updateRegistry();
			await updateRegistry();
			await updateRegistry();

			expect( listener_a ).toHaveBeenCalledTimes( 3 );
			expect( listener_b ).toHaveBeenCalledTimes( 3 );
			expect( listener_c ).toHaveBeenCalledTimes( 2 );
		} );
	} );
} );

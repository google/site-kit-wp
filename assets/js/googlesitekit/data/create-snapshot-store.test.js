/**
 * Snapshot store tests.
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
 * Internal dependencies
 */
import { getItem } from '@/js/googlesitekit/api/cache';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { createTestRegistry } from '@tests/js/utils';

describe( 'createSnapshotStore', () => {
	let registry;

	async function getSnapshot() {
		const { value } = await getItem( `datastore::cache::${ CORE_UI }` );

		return value;
	}

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'omitKeysFromSnapshot', () => {
		it( 'requires an array of keys', () => {
			expect( () => {
				registry.dispatch( CORE_UI ).omitKeysFromSnapshot( 'foo' );
			} ).toThrow( 'keys must be an array.' );
		} );

		it( 'omits the keys, and the list of keys itself, from snapshots', async () => {
			registry.dispatch( CORE_UI ).setValues( { foo: 1, bar: 2 } );
			registry.dispatch( CORE_UI ).omitKeysFromSnapshot( [ 'foo' ] );

			await registry.dispatch( CORE_UI ).createSnapshot();

			const snapshot = await getSnapshot();

			expect( snapshot ).toHaveProperty( 'bar', 2 );
			expect( snapshot ).not.toHaveProperty( 'foo' );
			expect( snapshot ).not.toHaveProperty( 'keysToOmitFromSnapshot' );
		} );

		it( 'adds to the keys already omitted', async () => {
			registry
				.dispatch( CORE_UI )
				.setValues( { foo: 1, bar: 2, baz: 3 } );
			registry.dispatch( CORE_UI ).omitKeysFromSnapshot( [ 'foo' ] );
			registry.dispatch( CORE_UI ).omitKeysFromSnapshot( [ 'bar' ] );

			await registry.dispatch( CORE_UI ).createSnapshot();

			const snapshot = await getSnapshot();

			expect( snapshot ).toHaveProperty( 'baz', 3 );
			expect( snapshot ).not.toHaveProperty( 'foo' );
			expect( snapshot ).not.toHaveProperty( 'bar' );
		} );

		it( 'does not restore the omitted keys', async () => {
			registry.dispatch( CORE_UI ).setValues( { foo: 1, bar: 2 } );
			registry.dispatch( CORE_UI ).omitKeysFromSnapshot( [ 'foo' ] );

			await registry.dispatch( CORE_UI ).createSnapshot();

			// Simulate the page load on the user's return.
			registry = createTestRegistry();

			await registry.dispatch( CORE_UI ).restoreSnapshot();

			expect( registry.select( CORE_UI ).getValue( 'bar' ) ).toBe( 2 );
			expect( registry.select( CORE_UI ).getValue( 'foo' ) ).toBe(
				undefined
			);
		} );
	} );
} );

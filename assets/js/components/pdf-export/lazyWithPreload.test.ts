/**
 * `lazyWithPreload` tests.
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
import lazyWithPreload from './lazyWithPreload';

describe( 'lazyWithPreload', () => {
	it( 'adds the import factory as the preload method', () => {
		function factory() {
			return Promise.resolve( { default: () => null } );
		}

		const Component = lazyWithPreload( factory );

		expect( Component.preload ).toBe( factory );
	} );

	it( 'returns a lazy component, not the raw factory', () => {
		const Component = lazyWithPreload( () =>
			Promise.resolve( { default: () => null } )
		);

		// A lazy component carries a `$$typeof` marker, so this confirms the
		// helper returns a lazy component instead of the factory it received.
		expect( Component ).toHaveProperty( '$$typeof' );
	} );
} );

/**
 * Tests for Site Kit's Data store.
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
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

describe( 'Data', () => {
	const TEST_STORE = 'test/store';
	const storeDefinition = {
		initialState: { foo: 'bar' },
		reducer: ( state ) => {
			return state;
		},
		selectors: {
			getFoo( state ) {
				return state.foo;
			},
		},
	};

	it( 'delegates selects to parent wp.data if it exists', () => {
		global.wp = {};
		global.wp.data = createRegistry( { [ TEST_STORE ]: storeDefinition } );

		const Data = require( './index' ).default;

		const selectors = Data.select( TEST_STORE );
		expect( selectors.getFoo() ).toBe( 'bar' );
	} );
} );

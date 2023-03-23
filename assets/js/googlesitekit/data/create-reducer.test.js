/**
 * Create Immer reducer utility function tests.
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
import { createReducer } from './create-reducer';

describe( 'createReducer', () => {
	it( 'creates a reducer from the passed function', () => {
		const reducer = createReducer( ( state, action ) => {
			switch ( action.type ) {
				case 'foo':
					return 'bar';
				case 'bar':
					return 'baz';
				default:
					return state;
			}
		} );

		expect( reducer ).toEqual( expect.any( Function ) );

		const state = 'qux';

		expect( reducer( state, { type: 'foo' } ) ).toBe( 'bar' );
		expect( reducer( state, { type: 'bar' } ) ).toBe( 'baz' );
		expect( reducer( state, { type: 'baz' } ) ).toBe( state );
	} );

	it( 'allows mutating of the state within the reducer, while still producing new references due to the use of Immer', () => {
		const reducer = createReducer( ( state, action ) => {
			switch ( action.type ) {
				case 'increment-counter':
					state.counter++;
					// Note, we don't need to return anything.
					break;
				case 'increment-nested-counter':
					state.nested.counter++;
					break;
				default:
					// Note, it's not actually necessary to return anything, the unmodified state will be returned by default.
					break;
			}
		} );

		let state = {
			counter: 1,
		};

		let newState = reducer( state, { type: 'increment-counter' } );

		// Note how counter has been incremented...
		expect( newState ).toEqual( { counter: 2 } );
		// And a new object has been returned, despite the apparent mutation of the state object within the reducer.
		expect( newState ).not.toBe( state );

		state = {
			counter: 1,
			nested: {
				counter: 2,
			},
		};

		newState = reducer( state, { type: 'increment-nested-counter' } );

		// The nested counter has been incremented...
		expect( newState ).toEqual( { counter: 1, nested: { counter: 3 } } );
		// While a new object has been returned...
		expect( newState ).not.toBe( state );
		// And `nested` is a new object too.
		expect( newState.nested ).not.toBe( state.nested );

		state = { counter: 1 };

		newState = reducer( state, { type: 'another-action-type' } );
		// The original state is returned in the default case:
		expect( newState ).toEqual( state );
		expect( newState ).toBe( state );
	} );

	it( 'allows mixing of mutation and returning entirely new objects from the reducer', () => {
		const reducer = createReducer( ( state, action ) => {
			switch ( action.type ) {
				case 'set-counter':
					state.counter = action.payload;
					break;
				case 'increment-nested-counter':
					// We can mix mutation and vanilla-style returning of new objects.
					return {
						...state,
						nested: {
							...state.nested,
							counter: state.nested.counter + 1,
						},
					};
				default:
					break;
			}
		} );

		let state = {
			counter: 1,
		};

		let newState = reducer( state, {
			type: 'set-counter',
			payload: 2,
		} );

		expect( newState ).toEqual( { counter: 2 } );
		expect( newState ).not.toBe( state );

		state = {
			counter: 1,
			nested: {
				counter: 2,
			},
		};

		newState = reducer( state, { type: 'increment-nested-counter' } );

		expect( newState ).toEqual( { counter: 1, nested: { counter: 3 } } );
		expect( newState ).not.toBe( state );
		expect( newState.nested ).not.toBe( state.nested );
	} );
} );

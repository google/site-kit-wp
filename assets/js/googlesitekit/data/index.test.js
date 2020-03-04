/**
 * Internal dependencies
 */
import Data from './index';
import { initializeAction } from './utils';

describe( 'data', () => {
	describe( 'Data.collectActions()', () => {
		it( 'should collect multiple actions and combine them into one object', () => {
			const objectOne = {
				bar: () => {},
				foo: () => {},
			};
			const objectTwo = {
				cat: () => {},
				dog: () => {},
			};

			expect( Data.collectActions( objectOne, objectTwo ) ).toMatchObject( {
				...objectOne,
				...objectTwo,
			} );
		} );

		it( 'should include an initialize action that dispatches an INITIALIZE action type', () => {
			const objectOne = {
				bar: () => {},
				foo: () => {},
			};
			const objectTwo = {
				cat: () => {},
				dog: () => {},
			};

			expect( Data.collectActions( objectOne, objectTwo ) ).toMatchObject( {
				initialize: initializeAction,
			} );
		} );
	} );

	describe( 'Data.collectReducers()', () => {
		it( 'should respond to an INITIALIZE action because it extends the reducers to include one', () => {
			const reducer = ( state, action ) => {
				switch ( action.type ) {
					default: {
						return { ...state };
					}
				}
			};
			const initialState = { count: 0 };
			const combinedReducer = Data.collectReducers( initialState, [ reducer ] );

			let state = combinedReducer();
			expect( state ).toEqual( { count: 0 } );

			// Normally we'd be dispatching an action to change state, but for our
			// testing purposes this is fine 😅
			state.count = 5;
			expect( state ).toEqual( { count: 5 } );

			state = combinedReducer( state, initializeAction() );

			expect( state ).toEqual( { count: 0 } );
		} );

		it( 'should include an initialize action that dispatches an INITIALIZE action type', () => {
			const objectOne = {
				bar: () => {},
				foo: () => {},
			};
			const objectTwo = {
				cat: () => {},
				dog: () => {},
			};

			expect( Data.collectActions( objectOne, objectTwo ) ).toMatchObject( {
				initialize: initializeAction,
			} );
		} );
	} );
} );

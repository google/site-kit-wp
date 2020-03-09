/**
 * Internal dependencies
 */
import {
	addInitializeAction,
	addInitializeReducer,
	collect,
	collectActions,
	collectReducers,
	initializeAction,
} from './utils';

describe( 'data utils', () => {
	describe( 'collect()', () => {
		it( 'should collect multiple objects and combine them into one', () => {
			const objectOne = {
				bar: () => {},
				foo: () => {},
			};
			const objectTwo = {
				cat: () => {},
				dog: () => {},
			};

			expect( collect( objectOne, objectTwo ) ).toEqual( {
				...objectOne,
				...objectTwo,
			} );
		} );

		it( 'should accept as many objects as supplied', () => {
			const objectOne = {
				bar: () => {},
				foo: () => {},
			};
			const objectTwo = {
				cat: () => {},
				dog: () => {},
			};
			const objectThree = {
				feline: () => {},
				wolf: () => {},
			};
			const objectFour = {
				mouse: () => {},
				rat: () => {},
			};
			const objectFive = {
				horse: () => {},
				unicorn: () => {},
			};

			expect( collect(
				objectOne,
				objectTwo,
				objectThree,
				objectFour,
				objectFive
			) ).toEqual( {
				...objectOne,
				...objectTwo,
				...objectThree,
				...objectFour,
				...objectFive,
			} );
		} );

		it( 'should error if objects have the same key', () => {
			// This can lead to subtle/hard-to-detect errors, so we check for it
			// whenever combining store actions, selectors, etc.
			// See: https://github.com/google/site-kit-wp/pull/1162/files#r385912255
			const objectOne = {
				cat: () => {},
				feline: () => {},
				mouse: () => {},
			};
			const objectTwo = {
				cat: () => {},
				feline: () => {},
				dog: () => {},
			};

			expect( () => {
				collect( objectOne, objectTwo );
			} ).toThrow( /Your call to collect\(\) contains the following duplicated functions: cat, feline./ );
		} );
	} );

	describe( 'addInitializeAction()', () => {
		it( 'should include an initialize action that dispatches an INITIALIZE action type', () => {
			const objectOne = {
				bar: () => {},
				foo: () => {},
			};
			const objectTwo = {
				cat: () => {},
				dog: () => {},
			};

			expect(
				addInitializeAction( collectActions( objectOne, objectTwo ) )
			).toMatchObject( {
				initialize: initializeAction,
			} );
		} );
	} );

	describe( 'reducer utility functions', () => {
		const fakeAction = () => {
			return { type: 'ACTION_ONE', payload: {} };
		};
		const anotherFakeAction = () => {
			return { type: 'ACTION_TWO', payload: {} };
		};

		const fakeReducer = ( state, action ) => {
			switch ( action.type ) {
				case 'ACTION_ONE':
					return { ...state, one: true };
				default: {
					return { ...state };
				}
			}
		};
		const fakeReducerTwo = ( state, action ) => {
			switch ( action.type ) {
				case 'ACTION_TWO':
					return { ...state, two: 2 };
				default: {
					return { ...state };
				}
			}
		};

		describe( 'collectReducers()', () => {
			it( 'should return modified state based on the reducers supplied', () => {
				const initialState = { count: 0 };
				const combinedReducer = collectReducers( initialState, fakeReducer, fakeReducerTwo );

				let state = combinedReducer();
				expect( state ).toEqual( { count: 0 } );
				expect( state.one ).toEqual( undefined );

				state = combinedReducer( state, fakeAction() );
				expect( state ).toEqual( { count: 0, one: true } );

				state = combinedReducer( state, anotherFakeAction() );
				expect( state ).toEqual( { count: 0, one: true, two: 2 } );

				// Should not respond to the initializeAction as this reducer is not
				// extended with `addInitializeReducer()`. This will return state as-is.
				const newState = combinedReducer( state, initializeAction() );

				expect( state ).toEqual( newState );
			} );
		} );

		describe( 'addInitializeReducer()', () => {
			it( 'should respond to an INITIALIZE action because it extends the reducers to include one', () => {
				const initialState = { count: 0 };
				const combinedReducer = addInitializeReducer(
					initialState,
					collectReducers( fakeReducer, fakeReducerTwo )
				);

				let state = combinedReducer();
				expect( state ).toEqual( { count: 0 } );

				// It should still respond to the original actions.
				state = combinedReducer( state, fakeAction() );
				expect( state ).toEqual( { count: 0, one: true } );

				state = combinedReducer( state, anotherFakeAction() );
				expect( state ).toEqual( { count: 0, one: true, two: 2 } );

				//
				state = combinedReducer( state, initializeAction() );
				expect( state ).toEqual( initialState );
			} );
		} );
	} );
} );

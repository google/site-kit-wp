/**
 * Data store utilities tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	collect,
	collectReducers,
	collectName,
	combineStores,
	createStrictSelect,
	createValidatedAction,
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

			expect(
				collect(
					objectOne,
					objectTwo,
					objectThree,
					objectFour,
					objectFive
				)
			).toEqual( {
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
			} ).toThrow(
				/Your call to collect\(\) contains the following duplicated functions: cat, feline./
			);
		} );
	} );

	describe( 'combineStores()', () => {
		it( 'should combine multiple stores into one', () => {
			const actionOne = () => ( { type: 'ACTION_ONE', payload: {} } );
			const actionTwo = () => ( { type: 'ACTION_TWO', payload: {} } );
			function CONTROL_ONE() {
				return null;
			}
			function CONTROL_TWO() {
				return null;
			}
			const getOne = ( state ) => state.one;
			const getTwo = ( state ) => state.two;
			function* getActionOne() {
				yield actionOne();
			}
			function* getActionTwo() {
				yield actionTwo();
			}

			const combinedStore = combineStores(
				{
					initialState: { one: 1 },
					actions: {
						actionOne,
					},
					controls: {
						CONTROL_ONE,
					},
					reducer: ( state, action ) => {
						switch ( action.type ) {
							case 'ACTION_ONE':
								return { ...state, one: true };
							default: {
								return state;
							}
						}
					},
					resolvers: {
						getActionOne,
					},
					selectors: {
						getOne,
					},
				},
				{
					initialState: { two: 2 },
					actions: {
						actionTwo,
					},
					controls: {
						CONTROL_TWO,
					},
					reducer: ( state, action ) => {
						switch ( action.type ) {
							case 'ACTION_TWO':
								return { ...state, two: 2 };
							default: {
								return state;
							}
						}
					},
					resolvers: {
						getActionTwo,
					},
					selectors: {
						getTwo,
					},
				}
			);

			// Initial state should contain both one and two
			expect( combinedStore.initialState ).toMatchObject( {
				one: 1,
				two: 2,
			} );

			// Actions should contain both actions
			expect( combinedStore.actions ).toMatchObject( {
				actionOne,
				actionTwo,
			} );

			// Controls should contain both controls
			expect( combinedStore.controls ).toMatchObject( {
				CONTROL_ONE,
				CONTROL_TWO,
			} );

			// Reducer should return combined initialState
			expect( combinedStore.reducer() ).toMatchObject( {
				one: 1,
				two: 2,
			} );

			// Resolvers should contain both resolvers
			expect( combinedStore.resolvers ).toMatchObject( {
				getActionOne,
				getActionTwo,
			} );

			// Selectors should contain both selectors
			expect( combinedStore.selectors ).toMatchObject( {
				getOne,
				getTwo,
			} );
		} );

		it( 'should modify combined state', () => {
			const actionOne = () => ( { type: 'ACTION_ONE', payload: {} } );
			const actionTwo = () => ( { type: 'ACTION_TWO', payload: {} } );
			function CONTROL_ONE() {
				return null;
			}
			function CONTROL_TWO() {
				return null;
			}
			const getOne = ( state ) => state.one;
			const getTwo = ( state ) => state.two;
			function* getActionOne() {
				yield actionOne();
			}
			function* getActionTwo() {
				yield actionTwo();
			}

			const combinedStore = combineStores(
				{
					initialState: { one: 1 },
					actions: {
						actionOne,
					},
					controls: {
						CONTROL_ONE,
					},
					reducer: ( state, action ) => {
						switch ( action.type ) {
							case 'ACTION_ONE':
								return { ...state, one: true };
							default: {
								return state;
							}
						}
					},
					resolvers: {
						getActionOne,
					},
					selectors: {
						getOne,
					},
				},
				{
					initialState: { two: 2 },
					actions: {
						actionTwo,
					},
					controls: {
						CONTROL_TWO,
					},
					reducer: ( state, action ) => {
						switch ( action.type ) {
							case 'ACTION_TWO':
								return { ...state, two: 2 };
							default: {
								return state;
							}
						}
					},
					resolvers: {
						getActionTwo,
					},
					selectors: {
						getTwo,
					},
				}
			);

			// Should have correct initial state
			let state = combinedStore.reducer();
			expect( state ).toEqual( { one: 1, two: 2 } );

			// It should respond to the original actions.
			state = combinedStore.reducer( state, actionOne() );
			expect( state ).toEqual( { one: true, two: 2 } );

			state = combinedStore.reducer( state, actionTwo() );
			expect( state ).toEqual( { one: true, two: 2 } );

			// Selector should get value
			expect( combinedStore.selectors.getOne( state ) ).toBe( true );
		} );

		it( 'should return an empty store by default', () => {
			expect( () => {
				combineStores();
			} ).not.toThrow();

			const newStore = combineStores();

			expect( newStore ).toMatchObject( {
				initialState: {},
				actions: {},
				controls: {},
				resolvers: {},
				selectors: {},
			} );

			// Reducer should be present, and pass through data.
			const state = { hello: 'world', cool: [ 'beans' ] };
			expect( newStore.reducer( state ) ).toEqual( state );
		} );

		it( 'should not error if no initialState is provided', () => {
			expect( () => {
				combineStores( {
					initialState: undefined,
					actions: {},
					controls: {},
					reducer: {},
					resolvers: {},
					selectors: {},
				} );
			} ).not.toThrow();
		} );

		it( 'should not error if no actions are provided', () => {
			expect( () => {
				combineStores( {
					initialState: {},
					actions: undefined,
					controls: {},
					reducer: {},
					resolvers: {},
					selectors: {},
				} );
			} ).not.toThrow();
		} );

		it( 'should not error if no controls are provided', () => {
			expect( () => {
				combineStores( {
					initialState: {},
					actions: {},
					controls: undefined,
					reducer: {},
					resolvers: {},
					selectors: {},
				} );
			} ).not.toThrow();
		} );

		it( 'should not error if no reducer is provided', () => {
			expect( () => {
				combineStores( {
					initialState: {},
					actions: {},
					controls: {},
					reducer: undefined,
					resolvers: {},
					selectors: {},
				} );
			} ).not.toThrow();
		} );

		it( 'should not error if no resolvers are provided', () => {
			expect( () => {
				combineStores( {
					initialState: {},
					actions: {},
					controls: {},
					reducer: {},
					resolvers: undefined,
					selectors: {},
				} );
			} ).not.toThrow();
		} );

		it( 'should not error if no selectors are provided', () => {
			expect( () => {
				combineStores( {
					initialState: {},
					actions: {},
					controls: {},
					reducer: {},
					resolvers: {},
					selectors: undefined,
				} );
			} ).not.toThrow();
		} );

		it( 'should not error if no keys are provided', () => {
			expect( () => {
				combineStores( {
					initialState: undefined,
					actions: undefined,
					controls: undefined,
					reducer: undefined,
					resolvers: undefined,
					selectors: undefined,
				} );
			} ).not.toThrow();
		} );

		it( 'should combine several stores that each contain values for only one key', () => {
			// Define actions, controls, resolvers and selectors
			const actionOne = () => ( { type: 'ACTION_ONE', payload: {} } );
			const actionTwo = () => ( { type: 'ACTION_TWO', payload: {} } );
			function CONTROL_ONE() {
				return null;
			}
			function CONTROL_TWO() {
				return null;
			}
			const getOne = ( state ) => state.one;
			const getTwo = ( state ) => state.two;
			function* getActionOne() {
				yield actionOne();
			}
			function* getActionTwo() {
				yield actionTwo();
			}

			// Create combined store from several stores which each contain values for only one key
			const combinedStore = combineStores(
				{ initialState: { one: 1 } },
				{ initialState: { two: 2 } },
				{
					reducer: ( state, action ) => {
						switch ( action.type ) {
							case 'ACTION_ONE':
								return { ...state, one: true };
							default: {
								return state;
							}
						}
					},
				},
				{
					reducer: ( state, action ) => {
						switch ( action.type ) {
							case 'ACTION_TWO':
								return { ...state, two: 2 };
							default: {
								return state;
							}
						}
					},
				},
				{
					actions: {
						actionOne,
					},
				},
				{
					actions: {
						actionTwo,
					},
				},
				{
					controls: {
						CONTROL_ONE,
					},
				},
				{
					controls: {
						CONTROL_TWO,
					},
				},
				{
					resolvers: {
						getActionOne,
					},
				},
				{
					resolvers: {
						getActionTwo,
					},
				},
				{
					selectors: {
						getOne,
					},
				},
				{
					selectors: {
						getTwo,
					},
				}
			);

			// Initial state should contain both one and two
			expect( combinedStore.initialState ).toMatchObject( {
				one: 1,
				two: 2,
			} );

			// Actions should contain both actions
			expect( combinedStore.actions ).toMatchObject( {
				actionOne,
				actionTwo,
			} );

			// Controls should contain both controls
			expect( combinedStore.controls ).toMatchObject( {
				CONTROL_ONE,
				CONTROL_TWO,
			} );

			// Reducer should return combined initialState
			expect( combinedStore.reducer() ).toMatchObject( {
				one: 1,
				two: 2,
			} );

			// Resolvers should contain both resolvers
			expect( combinedStore.resolvers ).toMatchObject( {
				getActionOne,
				getActionTwo,
			} );

			// Selectors should contain both selectors
			expect( combinedStore.selectors ).toMatchObject( {
				getOne,
				getTwo,
			} );
		} );

		it( 'initialStates, reducers, actions, and selectors should work together when provided by separate stores', () => {
			// Define actions, controls, resolvers and selectors
			const actionOne = () => ( { type: 'ACTION_ONE', payload: {} } );
			const actionTwo = () => ( { type: 'ACTION_TWO', payload: {} } );
			const getOne = ( state ) => state.one;
			const getTwo = ( state ) => state.two;

			// Create combined store from several stores which each contain values for only one key
			const combinedStore = combineStores(
				{ initialState: { one: 1 } },
				{ initialState: { two: 2 } },
				{
					reducer: ( state, action ) => {
						switch ( action.type ) {
							case 'ACTION_ONE':
								return { ...state, one: true };
							default: {
								return state;
							}
						}
					},
				},
				{
					reducer: ( state, action ) => {
						switch ( action.type ) {
							case 'ACTION_TWO':
								return { ...state, two: 'two' };
							default: {
								return state;
							}
						}
					},
				},
				{
					actions: {
						actionOne,
					},
				},
				{
					actions: {
						actionTwo,
					},
				},
				{
					selectors: {
						getOne,
					},
				},
				{
					selectors: {
						getTwo,
					},
				}
			);

			// Reducer should return correct initial state containing one and two
			let state = combinedStore.reducer();
			expect( state ).toMatchObject( { one: 1, two: 2 } );

			// Reducer from one store responds to an action that was provided by a different store.
			state = combinedStore.reducer( state, actionOne() );
			expect( state ).toEqual( { one: true, two: 2 } );

			// Selector from one store should properly get state that was provided by a different store
			expect( combinedStore.selectors.getOne( state ) ).toBe( true );
		} );

		it( 'should error if action keys are duplicated', () => {
			expect( () => {
				combineStores(
					{
						actions: {
							actionOne() {
								return { type: 'ACTION_ONE', payload: {} };
							},
						},
					},
					{
						actions: {
							actionOne() {
								return { type: 'ACTION_ONE', payload: {} };
							},
						},
					}
				);
			} ).toThrow(
				/collect\(\) cannot accept collections with duplicate keys. Your call to collect\(\) contains the following duplicated functions: actionOne./
			);
		} );

		it( 'should error if control keys are duplicated', () => {
			expect( () => {
				combineStores(
					{
						controls: {
							CONTROL_ONE() {
								return null;
							},
						},
					},
					{
						controls: {
							CONTROL_ONE() {
								return null;
							},
						},
					}
				);
			} ).toThrow(
				/collect\(\) cannot accept collections with duplicate keys. Your call to collect\(\) contains the following duplicated functions: CONTROL_ONE./
			);
		} );

		it( 'should error if selector keys are duplicated', () => {
			expect( () => {
				combineStores(
					{
						resolvers: {
							*getActionOne() {
								yield () => {};
							},
						},
					},
					{
						resolvers: {
							*getActionOne() {
								yield () => {};
							},
						},
					}
				);
			} ).toThrow(
				/collect\(\) cannot accept collections with duplicate keys. Your call to collect\(\) contains the following duplicated functions: getActionOne./
			);
		} );

		it( 'should error if resolver keys are duplicated', () => {
			expect( () => {
				combineStores(
					{
						selectors: {
							getOne: ( state ) => {
								return state.one;
							},
						},
					},
					{
						selectors: {
							getOne: ( state ) => {
								return state.one;
							},
						},
					}
				);
			} ).toThrow(
				/collect\(\) cannot accept collections with duplicate keys. Your call to collect\(\) contains the following duplicated functions: getOne./
			);
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
					return state;
				}
			}
		};
		const fakeReducerTwo = ( state, action ) => {
			switch ( action.type ) {
				case 'ACTION_TWO':
					return { ...state, two: 2 };
				default: {
					return state;
				}
			}
		};

		describe( 'collectReducers()', () => {
			it( 'should return modified state based on the reducers supplied', () => {
				const initialState = { count: 0 };
				const combinedReducer = collectReducers(
					initialState,
					fakeReducer,
					fakeReducerTwo
				);

				let state = combinedReducer();
				expect( state ).toEqual( { count: 0 } );
				expect( state.one ).toEqual( undefined );

				state = combinedReducer( state, fakeAction() );
				expect( state ).toEqual( { count: 0, one: true } );

				state = combinedReducer( state, anotherFakeAction() );
				expect( state ).toEqual( { count: 0, one: true, two: 2 } );
			} );
		} );

		describe( 'collectName()', () => {
			it( 'should return the single store name', () => {
				const individualStoreName = 'core/site';
				const collectedStoreName = collectName(
					individualStoreName,
					individualStoreName,
					individualStoreName
				);

				expect( collectedStoreName ).toEqual( individualStoreName );
			} );

			it( 'should error if not all store names match', () => {
				const storeName = 'core/site';
				const wrongStoreName = 'core/user';

				expect( () => {
					collectName(
						storeName,
						storeName,
						wrongStoreName,
						storeName
					);
				} ).toThrow(
					/collectName\(\) must not receive different names./
				);
			} );
		} );
	} );

	describe( 'createStrictSelect', () => {
		let registry;
		let strictSelect;
		let strictSelectors;

		const RECEIVE_FOO = 'RECEIVE_FOO';
		const TEST_STORE = 'test/store';
		const storeDefinition = {
			initialState: {
				foo: undefined,
			},
			actions: {
				receiveFoo( value ) {
					return {
						type: RECEIVE_FOO,
						payload: { value },
					};
				},
			},
			reducer: ( state, { type, payload } ) => {
				switch ( type ) {
					case RECEIVE_FOO:
						return { ...state, foo: payload.value };
					default:
						return state;
				}
			},
			selectors: {
				getFoo( state ) {
					return state.foo;
				},
			},
		};

		beforeEach( () => {
			registry = createRegistry();
			registry.registerStore( TEST_STORE, storeDefinition );
			strictSelect = createStrictSelect( registry.select );
			strictSelectors = strictSelect( TEST_STORE );
		} );

		describe( 'strictSelect', () => {
			it( 'provides all the same selectors as registry.select', () => {
				const regularSelectors = registry.select( TEST_STORE );
				expect( Object.keys( strictSelectors ) ).toEqual(
					Object.keys( regularSelectors )
				);
			} );

			it( 'throws an error if a strict selector returns undefined', () => {
				expect(
					registry.select( TEST_STORE ).getFoo()
				).toBeUndefined();
				expect( () => strictSelectors.getFoo() ).toThrow(
					'getFoo(...) is not resolved'
				);
			} );

			it( 'does not throw an error if a strict selector returns any other falsy value', () => {
				registry.dispatch( TEST_STORE ).receiveFoo( null );
				expect( strictSelectors.getFoo() ).toBe( null );

				registry.dispatch( TEST_STORE ).receiveFoo( false );
				expect( strictSelectors.getFoo() ).toBe( false );

				registry.dispatch( TEST_STORE ).receiveFoo( '' );
				expect( strictSelectors.getFoo() ).toBe( '' );

				registry.dispatch( TEST_STORE ).receiveFoo( 0 );
				expect( strictSelectors.getFoo() ).toBe( 0 );
			} );

			it( 'only generates strict selectors once for each store', () => {
				expect( strictSelect( TEST_STORE ) ).toStrictEqual(
					strictSelect( TEST_STORE )
				);
				expect(
					createStrictSelect( registry.select )( TEST_STORE )
				).toStrictEqual( strictSelect( TEST_STORE ) );
			} );
		} );
	} );

	describe( 'createValidatedAction', () => {
		it( 'should throw an error if a validator function is not provided', () => {
			const actionCreator = noop;

			return expect( () =>
				createValidatedAction( null, actionCreator )
			).toThrow( 'a validator function is required.' );
		} );

		it( 'should throw an error if an action creator function is not provided', () => {
			const validator = noop;

			return expect( () => createValidatedAction( validator ) ).toThrow(
				'an action creator function is required.'
			);
		} );

		it( 'should throw an error if validator function is a generator object', () => {
			function* validator() {}
			const actionCreator = noop;

			return expect( () =>
				createValidatedAction( validator, actionCreator )
			).toThrow(
				'an action’s validator function must not be a generator.'
			);
		} );

		it( 'should call validation function', () => {
			const args = { foo: 'bar' };
			const validator = jest.fn();
			const actionCreator = noop;

			const validatedAction = createValidatedAction(
				validator,
				actionCreator
			);

			validatedAction( args );

			expect( validator ).toHaveBeenCalledTimes( 1 );
			expect( validator ).toHaveBeenCalledWith( args );
		} );

		it( 'should call action creator', () => {
			const args = { foo: 'bar' };
			const validator = noop;
			const actionCreator = jest.fn();

			const validatedAction = createValidatedAction(
				validator,
				actionCreator
			);

			validatedAction( args );

			expect( actionCreator ).toHaveBeenCalledTimes( 1 );
			expect( actionCreator ).toHaveBeenCalledWith( args );
		} );

		it( 'should not call action creator if validator throws an exception ', () => {
			const args = { foo: 'bar' };
			const validator = () => {
				throw new Error( 'foo' );
			};
			const actionCreator = jest.fn();

			const validatedAction = createValidatedAction(
				validator,
				actionCreator
			);

			expect( () => validatedAction( args ) ).toThrow( 'foo' );

			expect( actionCreator ).toHaveBeenCalledTimes( 0 );
		} );
	} );
} );

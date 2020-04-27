/**
 * Data store utilities tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import {
	addInitializeAction,
	addInitializeReducer,
	collect,
	collectActions,
	collectControls,
	collectReducers,
	collectResolvers,
	collectSelectors,
	collectName,
	combineStores,
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

	describe( 'combineStores()', () => {
		const combineStoresFakeActionOne = {
			fakeActionOne() {
				return { type: 'ACTION_ONE', payload: {} };
			},
		};

		const combineStoresFakeActionTwo = {
			fakeActionTwo() {
				return { type: 'ACTION_TWO', payload: {} };
			},
		};

		const combineStoresFakeReducerOne = ( state, action ) => {
			switch ( action.type ) {
				case 'ACTION_ONE':
					return { ...state, one: true };
				default: {
					return { ...state };
				}
			}
		};

		const combineStoresFakeReducerTwo = ( state, action ) => {
			switch ( action.type ) {
				case 'ACTION_TWO':
					return { ...state, two: 2 };
				default: {
					return { ...state };
				}
			}
		};

		const combineStoresFakeReducerFour = ( state, action ) => {
			switch ( action.type ) {
				case 'ACTION_FOUR':
					return { ...state, four: 4 };
				default: {
					return { ...state };
				}
			}
		};

		const combineStoresFakeControlsOne = {
			FAKE_CONTROL_ONE: () => {
				return null;
			},
		};

		const combineStoresFakeControlsTwo = {
			FAKE_CONTROL_TWO: () => {
				return null;
			},
		};

		const combineStoresFakeResolversOne = {
			*getFakeActionOne() {
				yield combineStoresFakeActionOne.fakeActionOne();
			},
		};

		const combineStoresFakeResolversTwo = {
			*getFakeActionTwo() {
				yield combineStoresFakeActionTwo.fakeActionTwo();
			},
		};

		const combineStoresFakeSelectorsOne = {
			getOne: ( state ) => {
				return state.one;
			},
		};
		const combineStoresFakeSelectorsTwo = {
			getTwo: ( state ) => {
				return state.two;
			},
		};

		const storeOne = {
			INITIAL_STATE: { one: 1 },
			actions: combineStoresFakeActionOne,
			controls: combineStoresFakeControlsOne,
			reducer: combineStoresFakeReducerOne,
			resolvers: combineStoresFakeResolversOne,
			selectors: combineStoresFakeSelectorsOne,
		};

		const storeTwo = {
			INITIAL_STATE: { two: 2 },
			actions: combineStoresFakeActionTwo,
			controls: combineStoresFakeControlsTwo,
			reducer: combineStoresFakeReducerTwo,
			resolvers: combineStoresFakeResolversTwo,
			selectors: combineStoresFakeSelectorsTwo,
		};

		const storeThree = {
			INITIAL_STATE: { three: 3 },
		};

		const storeFour = {
			reducer: combineStoresFakeReducerFour,
		};

		const storeFive = {
			actions: {
				fakeActionOne() {
					return { type: 'ACTION_ONE', payload: {} };
				},
			},
		};

		const storeSix = {
			controls: {
				FAKE_CONTROL_ONE: () => {
					return null;
				},
			},
		};

		const storeSeven = {
			resolvers: {
				*getFakeActionOne() {
					yield combineStoresFakeActionOne.fakeActionOne();
				},
			},
		};

		const storeEight = {
			selectors: {
				getOne: ( state ) => {
					return state.one;
				},
			},
		};

		it( 'should combine multiple stores into one', () => {
			const expectedCombinedStore = {
				INITIAL_STATE: collect( storeOne.INITIAL_STATE, storeTwo.INITIAL_STATE ),
				actions: collectActions( storeOne.actions, storeTwo.actions ),
				controls: collectControls( storeOne.controls, storeTwo.controls ),
				reducer: collectReducers( storeOne.reducer, storeTwo.reducer ),
				resolvers: collectResolvers( storeOne.resolvers, storeTwo.resolvers ),
				selectors: collectSelectors( storeOne.selectors, storeTwo.selectors ),
			};
			expect( JSON.stringify( combineStores( storeOne, storeTwo ) ) ).toBe( JSON.stringify( expectedCombinedStore ) );
		} );

		it( 'should modify combined state', () => {
			const combinedStore = combineStores( storeOne, storeTwo );
			let state = combinedStore.reducer();

			expect( state ).toEqual( { one: 1, two: 2 } );

			// It should still respond to the original actions.
			state = combinedStore.reducer( state, combinedStore.actions.fakeActionOne() );
			expect( state ).toEqual( { one: true, two: 2 } );

			state = combinedStore.reducer( state, combinedStore.actions.fakeActionTwo() );
			expect( state ).toEqual( { one: true, two: 2 } );
		} );

		it( 'should combine stores missing any of the keys', () => {
			const combinedStoreMissing = {
				INITIAL_STATE: collect( storeOne.INITIAL_STATE, storeTwo.INITIAL_STATE, storeThree.INITIAL_STATE ),
				actions: collectActions( storeOne.actions, storeTwo.actions ),
				controls: collectControls( storeOne.controls, storeTwo.controls ),
				reducer: collectReducers( storeOne.reducer, storeTwo.reducer ),
				resolvers: collectResolvers( storeOne.resolvers, storeTwo.resolvers ),
				selectors: collectSelectors( storeOne.selectors, storeTwo.selectors ),
			};
			expect( JSON.stringify( combineStores( storeOne, storeTwo, storeThree ) ) ).toBe( JSON.stringify( combinedStoreMissing ) );

			const combinedStoreMissingTwo = {
				INITIAL_STATE: collect( storeOne.INITIAL_STATE, storeTwo.INITIAL_STATE ),
				actions: collectActions( storeOne.actions, storeTwo.actions ),
				controls: collectControls( storeOne.controls, storeTwo.controls ),
				reducer: collectReducers( storeOne.reducer, storeTwo.reducer, storeFour.reducer ),
				resolvers: collectResolvers( storeOne.resolvers, storeTwo.resolvers ),
				selectors: collectSelectors( storeOne.selectors, storeTwo.selectors ),
			};
			expect( JSON.stringify( combineStores( storeOne, storeTwo, storeFour ) ) ).toBe( JSON.stringify( combinedStoreMissingTwo ) );
		} );

		it( 'INITIAL_STATEs, reducers, and actions should all work together even if provided by separate incomplete stores', () => {
			const combinedStore = combineStores(
				{ INITIAL_STATE: { one: 1 } },
				{ reducer: combineStoresFakeReducerOne },
				storeTwo,
				storeFive
			);
			let state = combinedStore.reducer();

			expect( state ).toEqual( { one: 1, two: 2 } );

			// Reducer from one incomplete store responds to an action added by a different incomplete store.
			state = combinedStore.reducer( state, combinedStore.actions.fakeActionOne() );
			expect( state ).toEqual( { one: true, two: 2 } );
		} );

		it( 'should error if action keys are duplicated', () => {
			expect( () => {
				combineStores( storeOne, storeFive );
			} ).toThrow( /collect\(\) cannot accept collections with duplicate keys. Your call to collect\(\) contains the following duplicated functions: fakeActionOne./ );
		} );

		it( 'should error if control keys are duplicated', () => {
			expect( () => {
				combineStores( storeOne, storeSix );
			} ).toThrow( /collect\(\) cannot accept collections with duplicate keys. Your call to collect\(\) contains the following duplicated functions: FAKE_CONTROL_ONE./ );
		} );

		it( 'should error if selector keys are duplicated', () => {
			expect( () => {
				combineStores( storeOne, storeSeven );
			} ).toThrow( /collect\(\) cannot accept collections with duplicate keys. Your call to collect\(\) contains the following duplicated functions: getFakeActionOne./ );
		} );

		it( 'should error if resolver keys are duplicated', () => {
			expect( () => {
				combineStores( storeOne, storeEight );
			} ).toThrow( /collect\(\) cannot accept collections with duplicate keys. Your call to collect\(\) contains the following duplicated functions: getOne./ );
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

		describe( 'collectName()', () => {
			it( 'should return the single store name', () => {
				const individualStoreName = 'core/site';
				const collectedStoreName = collectName( individualStoreName, individualStoreName, individualStoreName );

				expect( collectedStoreName ).toEqual( individualStoreName );
			} );

			it( 'should error if not all store names match', () => {
				const storeName = 'core/site';
				const wrongStoreName = 'core/user';

				expect( () => {
					collectName( storeName, storeName, wrongStoreName, storeName );
				} ).toThrow( /collectName\(\) must not receive different names./ );
			} );
		} );
	} );
} );

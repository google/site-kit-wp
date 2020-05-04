/**
 * core/user Data store: userInfo tests.
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
 *
 * Internal dependencies
 */
import {
	createTestRegistry,
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { INITIAL_STATE } from './index';
import { STORE_NAME } from './constants';

describe( 'core/user userInfo', () => {
	const userDataGlobal = '_googlesitekitUserData';
	const userData = {
		user: {
			id: 1,
			email: 'admin@fakedomain.com',
			name: 'admin',
			picture: 'https://path/to/image',
		},
		verified: true,
	};

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		delete global[ userDataGlobal ];
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'receiveUserInfo', () => {
			it( 'requires the userInfo param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveUserInfo();
				} ).toThrow( 'userInfo is required.' );
			} );

			it( 'receives and sets userInfo ', async () => {
				await registry.dispatch( STORE_NAME ).receiveUserInfo( { ...userData } );
				expect( registry.select( STORE_NAME ).getUser() ).toMatchObject( userData );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getUser', () => {
			it( 'uses a resolver to load userInfo from a global variable', async () => {
				// Set up the global
				global[ userDataGlobal ] = userData;
				expect( global[ userDataGlobal ] ).not.toEqual( undefined );

				registry.select( STORE_NAME ).getUser();
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getUser() !== INITIAL_STATE
					),
				);

				const userInfo = registry.select( STORE_NAME ).getUser();
				expect( userInfo ).toMatchObject( userData );

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global[ userDataGlobal ] ).not.toEqual( undefined );
			} );
			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ userDataGlobal ] ).toEqual( undefined );

				muteConsole( 'error' );
				const userInfo = registry.select( STORE_NAME ).getUser();

				const { user, verified } = INITIAL_STATE;
				expect( userInfo ).toEqual( { user, verified } );
			} );
		} );

		describe.each( [
			[ 'getID' ],
			[ 'getName' ],
			[ 'getEmail' ],
			[ 'getPicture' ],
		] )( `%s()`, ( selector ) => {
			it( 'uses a resolver to load user info then returns the info when this specific selector is used', async () => {
				// Set up the global
				global[ userDataGlobal ] = userData;

				registry.select( STORE_NAME )[ selector ]();
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME )[ selector ]() !== undefined
					),
				);

				const userInfo = registry.select( STORE_NAME ).getUser();

				expect( userInfo ).toEqual( userData );
			} );
			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ userDataGlobal ] ).toEqual( undefined );

				muteConsole( 'error' );
				const result = registry.select( STORE_NAME )[ selector ]();

				expect( result ).toEqual( undefined );
			} );
		} );
	} );
} );

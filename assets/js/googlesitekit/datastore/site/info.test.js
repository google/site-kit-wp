/**
 * core/site data store: site info tests.
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
	createTestRegistry,
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import { INITIAL_STATE } from './index';
import { STORE_NAME } from './constants';

describe( 'core/site site info', () => {
	const baseInfoVar = '_googlesitekitBaseData';
	const baseInfo = {
		adminURL: 'http://something.test/wp-admin',
		ampMode: 'reader',
		homeURL: 'http://something.test/homepage',
		referenceSiteURL: 'http://something.test',
	};
	const entityInfoVar = '_googlesitekitEntityData';
	const entityInfo = {
		currentEntityURL: 'http://something.test',
		currentEntityType: 'post',
		currentEntityTitle: 'Something Witty',
		currentEntityID: '4',
	};
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		delete global[ baseInfoVar ];
		delete global[ entityInfoVar ];
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'receiveSiteInfo', () => {
			it( 'requires the siteInfo param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveSiteInfo();
				} ).toThrow( 'siteInfo is required.' );
			} );

			it( 'receives and sets site info ', async () => {
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( { ...baseInfo, ...entityInfo } );

				expect(
					registry.select( STORE_NAME ).getSiteInfo()
				).toMatchObject( { ...baseInfo, ...entityInfo, currentEntityID: 4 } );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getSiteInfo', () => {
			it( 'uses a resolver to load site info from a global variable by default, then deletes that global variable after consumption', async () => {
				global[ baseInfoVar ] = baseInfo;
				global[ entityInfoVar ] = entityInfo;

				expect( global[ baseInfoVar ] ).not.toEqual( undefined );
				expect( global[ entityInfoVar ] ).not.toEqual( undefined );

				registry.select( STORE_NAME ).getSiteInfo();
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getSiteInfo() !== INITIAL_STATE
					),
				);

				const info = registry.select( STORE_NAME ).getSiteInfo();

				expect( info ).toEqual( { ...baseInfo, ...entityInfo, currentEntityID: 4 } );

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global[ baseInfoVar ] ).not.toEqual( undefined );
				expect( global[ entityInfoVar ] ).not.toEqual( undefined );
			} );

			it( 'will return initial state (undefined values) when no data is available', async () => {
				expect( global[ baseInfoVar ] ).toEqual( undefined );
				expect( global[ entityInfoVar ] ).toEqual( undefined );

				muteConsole( 'error' );
				const info = registry.select( STORE_NAME ).getSiteInfo();

				expect( info ).toMatchObject( INITIAL_STATE.siteInfo );
			} );
		} );

		describe.each( [
			[ 'getAdminURL' ],
			[ 'getAMPMode' ],
			[ 'getCurrentEntityID' ],
			[ 'getCurrentEntityTitle' ],
			[ 'getCurrentEntityType' ],
			[ 'getCurrentEntityURL' ],
			[ 'getHomeURL' ],
			[ 'getReferenceSiteURL' ],
		] )( `%i()`, ( selector ) => {
			it( 'uses a resolver to load site info then returns the info when this specific selector is used', async () => {
				global[ baseInfoVar ] = baseInfo;
				global[ entityInfoVar ] = entityInfo;

				registry.select( STORE_NAME )[ selector ]();
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME )[ selector ]() !== undefined
					),
				);

				const info = registry.select( STORE_NAME ).getSiteInfo();

				expect( info ).toEqual( { ...baseInfo, ...entityInfo, currentEntityID: 4 } );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ baseInfoVar ] ).toEqual( undefined );
				expect( global[ entityInfoVar ] ).toEqual( undefined );

				muteConsole( 'error' );
				const result = registry.select( STORE_NAME )[ selector ]();

				expect( result ).toEqual( undefined );
			} );
		} );

		describe( 'isAmp', () => {
			it( 'uses a resolver to load site info, then returns true if AMP mode is set', async () => {
				global[ baseInfoVar ] = baseInfo;
				global[ entityInfoVar ] = entityInfo;

				registry.select( STORE_NAME ).isAmp();
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).isAmp() !== undefined
					),
				);

				const isAmp = registry.select( STORE_NAME ).isAmp();

				expect( isAmp ).toEqual( true );
			} );

			it( 'uses a resolver to load site info, then returns false if AMP mode is not set', async () => {
				global[ baseInfoVar ] = {
					...baseInfo,
					ampMode: null,
				};
				global[ entityInfoVar ] = entityInfo;

				registry.select( STORE_NAME ).isAmp();
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).isAmp() !== undefined
					),
				);

				const isAmp = registry.select( STORE_NAME ).isAmp();

				expect( isAmp ).toEqual( false );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ baseInfoVar ] ).toEqual( undefined );
				expect( global[ entityInfoVar ] ).toEqual( undefined );

				muteConsole( 'error' );
				const result = registry.select( STORE_NAME ).isAmp();

				expect( result ).toEqual( undefined );
			} );
		} );
	} );
} );

/**
 * `modules/ads` moduleData store tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
	untilResolved,
} from '../../../../../tests/js/utils';
import { initialState } from './index';
import { ENUM_CONVERSION_EVENTS, MODULES_ANALYTICS_4 } from './constants';

describe( 'modules/ads module data', () => {
	const baseModulesGlobalName = '_googlesitekitModulesData';
	const baseData = {
		'analytics-4': {
			newEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
			lostEvents: [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ],
			newBadgeEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
			hasMismatchedTag: false,
		},
	};

	let registry;
	let store;

	beforeEach( () => {
		global[ baseModulesGlobalName ] = baseData;
		registry = createTestRegistry();
		store = registry.stores[ MODULES_ANALYTICS_4 ].store;
	} );

	afterEach( () => {
		delete global[ baseModulesGlobalName ];
	} );

	describe( 'actions', () => {
		describe( 'receiveModuleData', () => {
			it( 'requires the data param', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveModuleData();
				} ).toThrow( 'data is required.' );
			} );

			it( 'receives module data', async () => {
				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveModuleData( baseData );

				const moduleData = registry
					.select( MODULES_ANALYTICS_4 )
					.getModuleData();

				expect( moduleData ).toEqual( store.getState().moduleData );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getModuleData', () => {
			it( 'uses a resolver to load module data from a global variable by default, and does not delete that global variable after consumption', async () => {
				expect( global[ baseModulesGlobalName ] ).not.toEqual(
					undefined
				);

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveModuleData( baseData );

				registry.select( MODULES_ANALYTICS_4 ).getNewEvents();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getModuleData();

				const newEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getNewEvents();

				expect( newEvents ).toEqual(
					baseData[ 'analytics-4' ].newEvents
				);

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global[ baseModulesGlobalName ] ).not.toEqual(
					undefined
				);
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				delete global[ baseModulesGlobalName ];

				expect( global[ baseModulesGlobalName ] ).toEqual( undefined );

				const moduleData = registry
					.select( MODULES_ANALYTICS_4 )
					.getModuleData();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getModuleData();

				expect( moduleData ).toBe( initialState.moduleData );
				expect( moduleData.newEvents ).toBe( undefined );
			} );
		} );

		describe.each( [
			[ 'hasMismatchedGoogleTagID', 'hasMismatchedTag' ],
			[ 'getNewEvents', 'newEvents' ],
			[ 'getLostEvents', 'lostEvents' ],
			[ 'getNewBadgeEvents', 'newBadgeEvents' ],
		] )( '%s', ( selector, dataKey ) => {
			it( 'uses a resolver to load module data then returns the data when this specific selector is used', async () => {
				registry.select( MODULES_ANALYTICS_4 )[ selector ]();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getModuleData();

				const moduleData = registry
					.select( MODULES_ANALYTICS_4 )
					.getModuleData();

				expect( moduleData ).toHaveProperty( dataKey );
				expect( moduleData ).toEqual( baseData[ 'analytics-4' ] );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				delete global[ baseModulesGlobalName ];

				const result = registry
					.select( MODULES_ANALYTICS_4 )
					[ selector ]();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getModuleData();

				expect( result ).toEqual( undefined );
			} );
		} );
	} );
} );

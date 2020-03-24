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
 * External dependencies
 */

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	unsubscribeFromAll,
} from 'tests/js/utils';
import { STORE_NAME } from './index';

describe( 'core/site site info', () => {
	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
	} );

	afterEach( () => {
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
				const siteInfo = {
					adminURL: 'http://something.test/wp-admin',
					ampMode: 'reader',
					currentReferenceURL: 'http://something.test',
					currentEntityID: '4',
					currentEntityTitle: 'Something Witty',
					currentEntityType: 'post',
					homeURL: 'http://something.test/homepage',
					referenceSiteURL: 'http://something.test',
				};
				await registry.dispatch( STORE_NAME ).receiveSiteInfo( siteInfo );

				const state = store.getState();

				expect(
					registry.select( STORE_NAME ).getSiteInfo( state )
				).toMatchObject( { ...siteInfo, currentEntityID: 4 } );
			} );
		} );
	} );
} );

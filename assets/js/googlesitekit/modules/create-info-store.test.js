/**
 * Info datastore functions tests.
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
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { unsubscribeFromAll } from 'tests/js/utils';
import { createInfoStore } from './create-info-store';

const SETTING_SLUG = 'testSetting';
const MODULE_SLUG = 'base';

describe( 'createInfoStore store', () => {
	let registry;
	let storeDefinition;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createRegistry();

		storeDefinition = createInfoStore( MODULE_SLUG, {
			settingSlugs: [ SETTING_SLUG ],
			registry,
		} );
		registry.registerStore( storeDefinition.STORE_NAME, storeDefinition );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'name', () => {
		it( 'returns the correct default store name', () => {
			expect( storeDefinition.STORE_NAME ).toEqual( `modules/${ MODULE_SLUG }` );
		} );
	} );
} );

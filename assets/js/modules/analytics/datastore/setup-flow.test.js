/**
 * `modules/analytics` data store: setup-flow tests.
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { STORE_NAME } from './constants';
import { createTestRegistry, unsubscribeFromAll } from 'tests/js/utils';
import * as modulesAnalytics from '../';
// import * as fixtures from './__fixtures__';
// TODO - should be in own section? check other test copied from
import { createRegistry } from '@wordpress/data';

describe( 'modules/analytics properties', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	// TODO - in describe block like other tests for selector getSetupFlowMode

	it( 'should be true', () => {
		expect( true ).toBe( true );
	} );

	it( 'returns “legacy” if the modules/analytics-4 store is not available ', async () => {
		// only register this module
		const newRegistry = createRegistry();

		[
			modulesAnalytics,
		].forEach( ( { registerStore } ) => registerStore?.( newRegistry ) );

		registry = newRegistry;
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( STORE_NAME ).receiveGetSettings( {} );

		expect( registry.select( STORE_NAME ).getSetupFlowMode() ).toBe( 'legacy' );
	} );

	it.todo( 'should return “legacy” if isAdminAPIWorking() returns false ' );

	it.todo( 'should return undefined if isAdminAPIWorking() returns undefined ' );

	it.todo( 'should return “ua” if there is no account selected' );

	it.todo( 'should return “ua” if selected account returns an empty array from GA4 getProperties selector' );

	it.todo( 'should return “ga4” if selected account returns an empty array from UA getProperties selector' );

	it.todo( 'should return “ga4-transitional” if both GA4 and UA getProperties return non-empty array' );
} );


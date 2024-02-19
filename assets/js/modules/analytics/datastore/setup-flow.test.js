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
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { MODULES_ANALYTICS, FORM_SETUP } from './constants';
import {
	createTestRegistry,
	unsubscribeFromAll,
	provideModules,
} from '../../../../../tests/js/utils';

describe( 'modules/analytics setup-flow', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'canUseGA4Controls', () => {
			const bothConnected = [
				{
					slug: 'analytics',
					active: true,
					connected: true,
				},
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			];

			const oneIsConnected = [
				{
					slug: 'analytics',
					active: true,
					connected: true,
				},
				{
					slug: 'analytics-4',
					active: true,
					connected: false,
				},
			];

			it( 'should return TRUE if both modules are connected', () => {
				provideModules( registry, bothConnected );

				const canUseControls = registry
					.select( MODULES_ANALYTICS )
					.canUseGA4Controls();

				expect( canUseControls ).toBe( true );
			} );

			it( 'should return FALSE when one of the modules is not connected', () => {
				provideModules( registry, oneIsConnected );

				const canUseControls = registry
					.select( MODULES_ANALYTICS )
					.canUseGA4Controls();

				expect( canUseControls ).toBe( false );
			} );

			it( 'should return TRUE when "enableGA4" is set to true even if one of the modules is not connected', () => {
				provideModules( registry, oneIsConnected );

				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_SETUP, { enableGA4: true } );

				const canUseControls = registry
					.select( MODULES_ANALYTICS )
					.canUseGA4Controls();

				expect( canUseControls ).toBe( true );
			} );
		} );
	} );
} );

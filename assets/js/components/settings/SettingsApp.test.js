/**
 * SettingsApp component tests.
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
import { createHashHistory } from 'history';

/**
 * Internal dependencies
 */
import SettingsApp from './SettingsApp';
import { render, fireEvent, createTestRegistry, provideModules } from '../../../../tests/js/test-utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

describe( 'SettingsApp', () => {
	// Create hash history to interact with HashRouter using `history.push`
	const history = createHashHistory( { initialEntries: [ '/' ] } );
	const getTabID = ( path ) => SettingsApp.basePathToTabIndex[ path ];
	let registry;

	beforeEach( () => {
		global.location.hash = '';

		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetAuthentication( { needsReauthentication: false } );
		registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );

		provideModules( registry, [ {
			slug: 'analytics',
			name: 'Analytics',
			active: true,
			connected: true,
			setupComplete: true,
			SettingsEditComponent: () => <div data-testid="edit-component">edit</div>,
		} ] );

		global._googlesitekitLegacyData.modules.analytics = {
			...global._googlesitekitLegacyData.modules.analytics,
			active: true,
			setupComplete: true,
		};
	} );

	it( 'should switch to "/connected-services" route when corresponding tab is clicked.', async () => {
		history.push( '/admin-settings' );

		const { getAllByRole } = render( <SettingsApp />, { registry, useRouter: true } );

		fireEvent.click( getAllByRole( 'tab' )[ getTabID( 'connected-services' ) ] );
		expect( global.location.hash ).toEqual( '#/connected-services' );
	} );

	it( 'should switch to "/connect-more-services" route when corresponding tab is clicked.', async () => {
		const { getAllByRole } = render( <SettingsApp />, { registry, useRouter: true } );

		fireEvent.click( getAllByRole( 'tab' )[ getTabID( 'connect-more-services' ) ] );
		expect( global.location.hash ).toEqual( '#/connect-more-services' );
	} );

	it( 'should switch to "/admin-settings" route when corresponding tab is clicked.', async () => {
		const { getAllByRole } = render( <SettingsApp />, { registry, useRouter: true } );

		fireEvent.click( getAllByRole( 'tab' )[ getTabID( 'admin-settings' ) ] );
		expect( global.location.hash ).toEqual( '#/admin-settings' );
	} );
} );

/**
 * SettingsModule component tests.
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
import { Switch, Route } from 'react-router-dom';

/**
 * Internal dependencies
 */
import SettingsActiveModule from '.';
import { render, fireEvent, createTestRegistry, provideModules } from '../../../../../tests/js/test-utils';

describe( 'SettingsModule', () => {
	const SettingsModuleWithWrapper = () => (
		<Switch>
			<Route path={ [ '/connected-services/:moduleSlug/:action', '/connected-services/:moduleSlug', '/connected-services' ] }>
				<SettingsActiveModule slug="analytics" />
			</Route>
		</Switch>
	);

	// Create hash history to interact with HashRouter using `history.push`
	const history = createHashHistory();
	let registry;

	beforeEach( () => {
		global.location.hash = '';
		registry = createTestRegistry();

		provideModules( registry, [ {
			slug: 'analytics',
			name: 'Analytics',
			active: true,
			connected: true,
			setupComplete: true,
			SettingsEditComponent: () => <div data-testid="edit-component">edit</div>,
			SettingsViewComponent: () => <div data-testid="view-component">view</div>,
		} ] );
	} );

	it( 'should display SettingsViewComponent when on module view route', async () => {
		history.push( '/connected-services/analytics' );

		const { queryByTestID } = render( <SettingsModuleWithWrapper />, { history, registry } );

		expect( queryByTestID( 'view-component' ) ).toBeInTheDocument();
	} );

	it( 'should display SettingsEditComponent when on module edit route', async () => {
		history.push( '/connected-services/analytics/edit' );

		const { queryByTestID } = render( <SettingsModuleWithWrapper />, { history, registry } );

		expect( queryByTestID( 'edit-component' ) ).toBeInTheDocument();
	} );

	it( 'should change route when "Edit" link is clicked and switch to SettingsEditComponent', async () => {
		history.push( '/connected-services/analytics' );

		const { getByRole, queryByTestID } = render( <SettingsModuleWithWrapper />, { history, registry } );

		fireEvent.click( getByRole( 'link', { name: /edit/i } ) );

		expect( global.location.hash ).toEqual( '#/connected-services/analytics/edit' );
		expect( queryByTestID( 'edit-component' ) ).toBeInTheDocument();
	} );

	it( 'should change route when "Cancel" link is clicked and switch to SettingsViewComponent', async () => {
		history.push( '/connected-services/analytics/edit' );

		const { getByRole, queryByTestID } = render( <SettingsModuleWithWrapper />, { history, registry } );

		fireEvent.click( getByRole( 'link', { name: /cancel/i } ) );

		expect( global.location.hash ).toEqual( '#/connected-services/analytics' );
		expect( queryByTestID( 'view-component' ) ).toBeInTheDocument();
	} );

	it( 'should open accordion on click and change route and DOM correctly', async () => {
		history.push( '/connected-services' );

		const { getByRole, queryByTestID } = render( <SettingsModuleWithWrapper />, { history, registry } );

		fireEvent.click( getByRole( 'tab' ) );
		expect( global.location.hash ).toEqual( '#/connected-services/analytics' );
		expect( queryByTestID( 'view-component' ) ).toBeInTheDocument();
	} );

	it( 'should close accordion on click and change route & DOM correctly', async () => {
		history.push( '/connected-services/analytics' );

		const { getByRole, queryByTestID } = render( <SettingsModuleWithWrapper />, { history, registry } );

		fireEvent.click( getByRole( 'tab' ) );
		expect( global.location.hash ).toEqual( '#/connected-services' );
		expect( queryByTestID( 'view-component' ) ).toBeNull();
	} );
} );

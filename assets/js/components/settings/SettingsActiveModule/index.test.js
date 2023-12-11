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
import {
	render,
	fireEvent,
	createTestRegistry,
	provideModules,
	act,
	provideUserAuthentication,
} from '../../../../../tests/js/test-utils';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS } from '../../../modules/analytics/datastore/constants';
import { MODULES_TAGMANAGER } from '../../../modules/tagmanager/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';

describe( 'SettingsModule', () => {
	const SettingsModuleWithWrapper = ( { slug = 'analytics' } ) => (
		<Switch>
			<Route
				path={ [
					'/connected-services/:moduleSlug/:action',
					'/connected-services/:moduleSlug',
					'/connected-services',
				] }
			>
				<SettingsActiveModule slug={ slug } />
			</Route>
		</Switch>
	);

	// Create hash history to interact with HashRouter using `history.push`
	const history = createHashHistory();
	let registry;

	beforeEach( () => {
		global.location.hash = '';
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
				storeName: MODULES_ANALYTICS,
				SettingsEditComponent: () => (
					<div data-testid="edit-component">edit</div>
				),
				SettingsViewComponent: () => (
					<div data-testid="view-component">view</div>
				),
			},
			{
				slug: 'pagespeed-insights',
				active: true,
				connected: true,
				SettingsViewComponent: () => (
					<div data-testid="view-component">view</div>
				),
				// SettingsEditComponent is intentionally `null` here for no-edit-component tests below.
				SettingsEditComponent: null,
			},
			{
				slug: 'tagmanager',
				active: true,
				// Intentionally not connected here with both settings components for tests below.
				connected: false,
				storeName: MODULES_TAGMANAGER,
				SettingsEditComponent: () => (
					<div data-testid="edit-component">edit</div>
				),
				SettingsViewComponent: () => (
					<div data-testid="view-component">view</div>
				),
			},
		] );
		provideUserAuthentication( registry );
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {} );
	} );

	it( 'should display SettingsViewComponent when on module view route', () => {
		history.push( '/connected-services/analytics' );

		const { queryByTestID } = render( <SettingsModuleWithWrapper />, {
			history,
			registry,
		} );

		expect( queryByTestID( 'view-component' ) ).toBeInTheDocument();
	} );

	it( 'should display SettingsEditComponent when on module edit route', () => {
		history.push( '/connected-services/analytics/edit' );

		const { queryByTestID } = render( <SettingsModuleWithWrapper />, {
			history,
			registry,
		} );

		expect( queryByTestID( 'edit-component' ) ).toBeInTheDocument();
	} );

	it( 'should display SettingsViewComponent when on module edit route and module has no SettingsEditComponent', () => {
		history.push( '/connected-services/pagespeed-insights/edit' );

		const { queryByTestID } = render(
			<SettingsModuleWithWrapper slug="pagespeed-insights" />,
			{
				history,
				registry,
			}
		);

		expect( queryByTestID( 'edit-component' ) ).not.toBeInTheDocument();
		expect( queryByTestID( 'view-component' ) ).toBeInTheDocument();
	} );

	it( 'should change route when "Edit" link is clicked and switch to SettingsEditComponent', () => {
		history.push( '/connected-services/analytics' );

		const { getByRole, queryByTestID } = render(
			<SettingsModuleWithWrapper />,
			{ history, registry }
		);

		fireEvent.click( getByRole( 'link', { name: /edit/i } ) );

		expect( global.location.hash ).toEqual(
			'#/connected-services/analytics/edit'
		);
		expect( queryByTestID( 'edit-component' ) ).toBeInTheDocument();
	} );

	it( 'should change route when "Cancel" link is clicked and switch to SettingsViewComponent', async () => {
		history.push( '/connected-services/analytics/edit' );

		const { getByRole, queryByTestID, findByTestID } = render(
			<SettingsModuleWithWrapper />,
			{ history, registry }
		);

		fireEvent.click( getByRole( 'button', { name: /cancel/i } ) );

		await findByTestID( 'view-component' );

		expect( global.location.hash ).toEqual(
			'#/connected-services/analytics'
		);
		expect( queryByTestID( 'view-component' ) ).toBeInTheDocument();
	} );

	it( 'should change route when "Close" button is clicked and continue rendering SettingsViewComponent when module has no SettingsEditComponent', async () => {
		history.push( '/connected-services/pagespeed-insights/edit' );

		const { getByRole, queryByTestID, findByTestID } = render(
			<SettingsModuleWithWrapper slug="pagespeed-insights" />,
			{
				history,
				registry,
			}
		);

		expect( queryByTestID( 'view-component' ) ).toBeInTheDocument();
		fireEvent.click( getByRole( 'button', { name: /close/i } ) );
		await findByTestID( 'view-component' );

		expect( global.location.hash ).toEqual(
			'#/connected-services/pagespeed-insights'
		);
		expect( queryByTestID( 'view-component' ) ).toBeInTheDocument();
	} );

	it( 'should open accordion on click and change route and DOM correctly', () => {
		history.push( '/connected-services' );

		const { getByRole, queryByTestID } = render(
			<SettingsModuleWithWrapper />,
			{ history, registry }
		);

		fireEvent.click( getByRole( 'tab' ) );
		expect( global.location.hash ).toEqual(
			'#/connected-services/analytics'
		);
		expect( queryByTestID( 'view-component' ) ).toBeInTheDocument();
	} );

	it( 'should close accordion on click and change route & DOM correctly', () => {
		history.push( '/connected-services/analytics' );

		const { getByRole, queryByTestID } = render(
			<SettingsModuleWithWrapper />,
			{ history, registry }
		);

		fireEvent.click( getByRole( 'tab' ) );
		expect( global.location.hash ).toEqual( '#/connected-services' );
		expect( queryByTestID( 'view-component' ) ).toBeNull();
	} );

	it( 'should render a submit button when editing a connected module with settings', () => {
		history.push( '/connected-services/analytics/edit' );

		const { queryByRole } = render( <SettingsModuleWithWrapper />, {
			history,
			registry,
		} );

		expect(
			queryByRole( 'button', { name: /save/i } )
		).toBeInTheDocument();
		expect(
			queryByRole( 'button', { name: /close/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should render a close button when editing a non-connected module with settings', async () => {
		history.push( '/connected-services/tagmanager/edit' );

		// Hack to avoid act error due to state change during render.
		await act( () =>
			registry
				.__experimentalResolveSelect( CORE_MODULES )
				.canActivateModule( 'tagmanager' )
		);

		const { queryByRole } = render(
			<SettingsModuleWithWrapper slug="tagmanager" />,
			{
				history,
				registry,
			}
		);

		expect(
			queryByRole( 'button', { name: /save/i } )
		).not.toBeInTheDocument();
		expect(
			queryByRole( 'button', { name: /close/i } )
		).toBeInTheDocument();
	} );
} );

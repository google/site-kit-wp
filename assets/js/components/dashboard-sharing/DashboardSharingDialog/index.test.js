/**
 * DashboardSharingDialog tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { fireEvent, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	render,
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
	provideSiteConnection,
	provideUserInfo,
} from '../../../../../tests/js/test-utils';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import {
	RESET_SETTINGS_DIALOG,
	SETTINGS_DIALOG,
} from '../DashboardSharingSettings/constants';
import DashboardSharingDialog from '.';
import {
	sharingSettings,
	modules,
	roles,
} from './../DashboardSharingSettings/__fixtures__';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { MODULES_SEARCH_CONSOLE } from '../../../modules/search-console/datastore/constants';

describe( 'DashboardSharingDialog', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, modules );
		provideModuleRegistrations( registry );
		provideSiteConnection( registry, {
			hasMultipleAdmins: false,
		} );
		provideUserInfo( registry );

		registry
			.dispatch( CORE_MODULES )
			.receiveGetSharingSettings( sharingSettings );
		registry.dispatch( CORE_MODULES ).receiveShareableRoles( roles );
		registry
			.dispatch( CORE_MODULES )
			.receiveSharedOwnershipModules( [ 'pagespeed-insights' ] );

		registry.dispatch( CORE_USER ).receiveCapabilities( {
			'googlesitekit_manage_module_sharing_options::["search-console"]': true,
		} );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetSettings( { ownerID: 1 } );
	} );

	it( 'should not render the dialog when both dialogs are closed', () => {
		render( <DashboardSharingDialog />, { registry } );

		expect(
			screen.queryByText( 'Dashboard sharing & permissions' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Reset Dashboard Sharing permissions' )
		).not.toBeInTheDocument();
	} );

	it( 'should open the settings dialog when SETTINGS_DIALOG is true', () => {
		registry.dispatch( CORE_UI ).setValue( SETTINGS_DIALOG, true );

		render( <DashboardSharingDialog />, { registry } );

		expect(
			screen.getByText( 'Dashboard sharing & permissions' )
		).toBeInTheDocument();
		expect(
			screen.queryByText( 'Reset Dashboard Sharing permissions' )
		).not.toBeInTheDocument();
	} );

	it( 'should open the reset dialog when RESET_SETTINGS_DIALOG is true', () => {
		registry.dispatch( CORE_UI ).setValue( RESET_SETTINGS_DIALOG, true );

		render( <DashboardSharingDialog />, { registry } );

		expect(
			screen.queryByText( 'Dashboard sharing & permissions' )
		).not.toBeInTheDocument();
		expect(
			screen.getByText( 'Reset Dashboard Sharing permissions' )
		).toBeInTheDocument();
	} );

	it( 'should close the settings dialog when the Cancel button is clicked', async () => {
		registry.dispatch( CORE_UI ).setValue( SETTINGS_DIALOG, true );

		render( <DashboardSharingDialog />, { registry } );

		expect(
			screen.getByText( 'Dashboard sharing & permissions' )
		).toBeInTheDocument();

		fireEvent.click( screen.getByText( 'Cancel' ) );

		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( SETTINGS_DIALOG )
			).toBe( false );
		} );
	} );

	it( 'should switch from settings to reset dialog when "Reset sharing permissions" is clicked', async () => {
		registry.dispatch( CORE_UI ).setValue( SETTINGS_DIALOG, true );

		render( <DashboardSharingDialog />, { registry } );

		expect(
			screen.getByText( 'Dashboard sharing & permissions' )
		).toBeInTheDocument();

		fireEvent.click( screen.getByText( 'Reset sharing permissions' ) );

		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( SETTINGS_DIALOG )
			).toBe( false );
			expect(
				registry.select( CORE_UI ).getValue( RESET_SETTINGS_DIALOG )
			).toBe( true );
			expect(
				screen.getByText( 'Reset Dashboard Sharing permissions' )
			).toBeInTheDocument();
		} );
	} );

	it( 'should switch from reset to settings dialog and restore focus when Cancel is clicked', async () => {
		registry.dispatch( CORE_UI ).setValue( RESET_SETTINGS_DIALOG, true );

		render( <DashboardSharingDialog />, { registry } );

		expect(
			screen.getByText( 'Reset Dashboard Sharing permissions' )
		).toBeInTheDocument();

		fireEvent.click( screen.getByText( 'Cancel' ) );

		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( RESET_SETTINGS_DIALOG )
			).toBe( false );
			expect(
				registry.select( CORE_UI ).getValue( SETTINGS_DIALOG )
			).toBe( true );
			expect(
				screen.getByText( 'Dashboard sharing & permissions' )
			).toBeInTheDocument();

			// Should restore focus to the "Reset sharing permissions" button.
			const resetButton = document.querySelector(
				'.googlesitekit-reset-sharing-permissions-button'
			);
			expect( resetButton ).toHaveFocus();
		} );
	} );

	it( 'should close the settings dialog when the escape key is pressed', async () => {
		registry.dispatch( CORE_UI ).setValue( SETTINGS_DIALOG, true );

		render( <DashboardSharingDialog />, { registry } );

		expect(
			screen.getByText( 'Dashboard sharing & permissions' )
		).toBeInTheDocument();

		// Simulate pressing the Escape key.
		fireEvent.keyDown( document.body, { key: 'Escape', keyCode: 27 } );

		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( SETTINGS_DIALOG )
			).toBe( false );
		} );
	} );

	it( 'should switch from reset dialog to settings dialog and restore focus when the escape key is pressed', async () => {
		registry.dispatch( CORE_UI ).setValue( RESET_SETTINGS_DIALOG, true );

		render( <DashboardSharingDialog />, { registry } );

		expect(
			screen.getByText( 'Reset Dashboard Sharing permissions' )
		).toBeInTheDocument();

		// Simulate pressing the Escape key.
		fireEvent.keyDown( document.body, { key: 'Escape', keyCode: 27 } );

		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( RESET_SETTINGS_DIALOG )
			).toBe( false );
			expect(
				registry.select( CORE_UI ).getValue( SETTINGS_DIALOG )
			).toBe( true );
			expect(
				screen.getByText( 'Dashboard sharing & permissions' )
			).toBeInTheDocument();

			// Should restore focus to the "Reset sharing permissions" button.
			const resetButton = document.querySelector(
				'.googlesitekit-reset-sharing-permissions-button'
			);
			expect( resetButton ).toHaveFocus();
		} );
	} );

	it( 'should close the settings dialog when clicking on the scrim', async () => {
		registry.dispatch( CORE_UI ).setValue( SETTINGS_DIALOG, true );

		render( <DashboardSharingDialog />, { registry } );

		expect(
			screen.getByText( 'Dashboard sharing & permissions' )
		).toBeInTheDocument();

		// Find the scrim element and click it.
		const scrim = document.querySelector( '.mdc-dialog__scrim' );
		fireEvent.click( scrim );

		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( SETTINGS_DIALOG )
			).toBe( false );
		} );
	} );

	it( 'should switch from reset dialog to settings dialog and restore focus when clicking on the scrim', async () => {
		registry.dispatch( CORE_UI ).setValue( RESET_SETTINGS_DIALOG, true );

		render( <DashboardSharingDialog />, { registry } );

		expect(
			screen.getByText( 'Reset Dashboard Sharing permissions' )
		).toBeInTheDocument();

		// Find the scrim element and click it.
		const scrim = document.querySelector( '.mdc-dialog__scrim' );
		fireEvent.click( scrim );

		await waitFor( () => {
			expect(
				registry.select( CORE_UI ).getValue( RESET_SETTINGS_DIALOG )
			).toBe( false );
			expect(
				registry.select( CORE_UI ).getValue( SETTINGS_DIALOG )
			).toBe( true );
			expect(
				screen.getByText( 'Dashboard sharing & permissions' )
			).toBeInTheDocument();

			// Should restore focus to the "Reset sharing permissions" button.
			const resetButton = document.querySelector(
				'.googlesitekit-reset-sharing-permissions-button'
			);
			expect( resetButton ).toHaveFocus();
		} );
	} );
} );

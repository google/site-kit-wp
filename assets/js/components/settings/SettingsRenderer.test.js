/**
 * SettingsRenderer tests.
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
import Modules from 'googlesitekit-modules';
import SettingsRenderer from './SettingsRenderer';
import { createTestRegistry, provideModules } from '../../../../tests/js/utils';
import { render, act } from '../../../../tests/js/test-utils';
import { STORE_NAME } from '../../googlesitekit/modules/datastore/constants';

describe( 'SettingsRenderer', () => {
	let registry;

	const slug = 'test-module-slug';
	const storeName = `modules/${ slug }`;
	const settingSlugs = [ 'testSetting' ];

	const SettingsEdit = () => <div data-testid="edit-component">edit</div>;
	const SettingsView = () => <div data-testid="view-component">view</div>;

	beforeEach( () => {
		const storeDefinition = Modules.createModuleStore( slug, { storeName, settingSlugs } );

		registry = createTestRegistry();
		registry.registerStore( storeName, storeDefinition );
		registry.dispatch( storeName ).receiveGetSettings( { testSetting: 'initial value' } );
		provideModules( registry );
	} );

	it( 'renders nothing when not open', () => {
		const { container } = render( <SettingsRenderer slug={ slug } isOpen={ false } />, { registry } );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when passing a slug to a non-existent module', () => {
		const { container } = render( <SettingsRenderer slug={ 'non-existent-module' } isOpen />, { registry } );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'rolls back settings to the received values if changed when leaving edit context', async () => {
		const { rerender } = render( <SettingsRenderer slug={ slug } isOpen isEditing />, { registry } );

		await act( () => registry.dispatch( storeName ).setTestSetting( 'new value' ) );

		rerender( <SettingsRenderer slug={ slug } isOpen isEditing={ false } /> );

		expect( registry.select( storeName ).getTestSetting() ).toBe( 'initial value' );
	} );

	describe( 'registered module with view component only', () => {
		beforeEach( () => {
			registry.dispatch( STORE_NAME ).registerModule( slug, {
				settingsViewComponent: SettingsView,
			} );
		} );

		it( 'renders the view component when open, and not editing', () => {
			const { queryByTestID } = render( <SettingsRenderer slug={ slug } isOpen isEditing={ false } />, { registry } );

			expect( queryByTestID( 'view-component' ) ).toBeInTheDocument();
			expect( queryByTestID( 'edit-component' ) ).not.toBeInTheDocument();
		} );

		it( 'renders nothing when open, and editing', () => {
			const { queryByTestID } = render( <SettingsRenderer slug={ slug } isOpen isEditing />, { registry } );

			expect( queryByTestID( 'view-component' ) ).not.toBeInTheDocument();
			expect( queryByTestID( 'edit-component' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'registered module with both view and edit components', () => {
		beforeEach( () => {
			registry.dispatch( STORE_NAME ).registerModule( slug, {
				settingsViewComponent: SettingsView,
				settingsEditComponent: SettingsEdit,
			} );
		} );

		it( 'renders the view component when open, and not editing', () => {
			const { queryByTestID } = render( <SettingsRenderer slug={ slug } isOpen isEditing={ false } />, { registry } );

			expect( queryByTestID( 'view-component' ) ).toBeInTheDocument();
			expect( queryByTestID( 'edit-component' ) ).not.toBeInTheDocument();
		} );

		it( 'renders the edit component when open, and editing', () => {
			const { queryByTestID } = render( <SettingsRenderer slug={ slug } isOpen isEditing />, { registry } );

			expect( queryByTestID( 'view-component' ) ).not.toBeInTheDocument();
			expect( queryByTestID( 'edit-component' ) ).toBeInTheDocument();
		} );
	} );
} );

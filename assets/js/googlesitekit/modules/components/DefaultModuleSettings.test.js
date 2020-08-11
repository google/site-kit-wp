/**
 * DefaultModuleSettings component tests.
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
import API from 'googlesitekit-api';
import DefaultModuleSettings from './DefaultModuleSettings';
import {
	createTestRegistry,
	fireEvent,
	render,
	unsubscribeFromAll,
	waitFor,
} from '../../../../../tests/js/test-utils';
import { STORE_NAME } from '../datastore/constants';
import FIXTURES from '../datastore/fixtures.json';

const slug = 'analytics';

const setupRegistry = ( registry ) => {
	registry.dispatch( STORE_NAME ).receiveGetModules( FIXTURES );
	registry.dispatch( STORE_NAME ).activateModule( slug );
};

describe( 'DefaultModuleSettings', () => {
	let registry;

	beforeEach( async () => {
		// Invalidate the cache before every request, but keep it enabled to
		// make sure we're opting-out of the cache for the correct requests.
		await API.invalidateCache();

		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	it( 'Should render the ModuleSettings and ModuleSettingHeader components initially', async () => {
		const { container } = render( <DefaultModuleSettings slug={ slug } />, { setupRegistry } );

		// Expect ModuleSettings component component to be rendered.
		expect( container.firstChild ).toHaveClass( `googlesitekit-settings-module--${ slug }` );

		// Expect header to be rendered initially.
		await waitFor( () => container.querySelector( '.googlesitekit-settings-module__header' ) );
		expect( container.querySelector( '.googlesitekit-settings-module__header' ) ).not.toBe( null );
	} );

	it( 'Should open the ModuleSettings component on click', async () => {
		const { getByText } = render( <DefaultModuleSettings slug={ slug } />, { setupRegistry } );

		let isOpen = registry.select( STORE_NAME ).isSettingsOpen( slug );
		const module = registry.select( STORE_NAME ).getModule( slug );
		const { name } = module;

		// Expect ModuleSettings to be closed initially.
		expect( isOpen ).toBe( false );

		fireEvent.click( getByText( name ) );

		// Expect ModulesSettings to be open after click.
		isOpen = registry.select( STORE_NAME ).isSettingsOpen( slug );
		expect( isOpen ).toBe( true );
	} );

	it( 'Should show ModuleSettingsBody and ModuleSettingsFooter after opened', async () => {
		const { container, getByText } = render( <DefaultModuleSettings slug={ slug } />, { setupRegistry } );

		const module = registry.select( STORE_NAME ).getModule( slug );
		const { name } = module;

		// Expect ModuleSettingsBody and ModuleSettingsFooter components not to be rendered.
		expect( container.querySelector( '.googlesitekit-settings-module__footer' ) ).toBe( null );
		expect( container.querySelector( '.googlesitekit-settings-module__content' ) ).toBe( null );

		fireEvent.click( getByText( name ) );
		const isOpen = registry.select( STORE_NAME ).isSettingsOpen( slug );
		expect( isOpen ).toBe( true );

		await waitFor( () => container.querySelector( '.googlesitekit-settings-module__footer' ) );
		await waitFor( () => container.querySelector( '.googlesitekit-settings-module__content' ) );

		// Expect ModuleSettingsBody and ModuleSettingsFooter components to be rendered.
		expect( container.querySelector( '.googlesitekit-settings-module__footer' ) ).not.toBe( null );
		expect( container.querySelector( '.googlesitekit-settings-module__content' ) ).not.toBe( null );
	} );
} );

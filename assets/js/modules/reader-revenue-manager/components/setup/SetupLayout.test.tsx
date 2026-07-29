/**
 * Reader Revenue Manager SetupLayout component tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { type Registry } from '@/js/googlesitekit-data';
import { VIEW_CONTEXT_MODULE_SETUP } from '@/js/googlesitekit/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	provideModules,
	render,
} from '@tests/js/test-utils';
import SetupLayout from './SetupLayout';

jest.mock( '@/js/components/setup', () => {
	const actual = jest.requireActual( '@/js/components/setup' );

	return {
		...actual,
		DefaultModuleSetup: () => <div>Default module setup</div>,
	};
} );

describe( 'SetupLayout', () => {
	mockLocation();

	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: false,
			},
		] );

		registry
			.dispatch( CORE_MODULES )
			.registerModule( MODULE_SLUG_READER_REVENUE_MANAGER, {
				storeName: 'modules/reader-revenue-manager',
				SetupComponent: () => <div>Express setup component</div>,
			} );
	} );

	it( 'renders nothing when the module has no SetupComponent', () => {
		registry = createTestRegistry() as Registry;
		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: false,
			},
		] );

		const { container } = render( <SetupLayout />, {
			registry,
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders DefaultModuleSetup when expressSetup is not true', () => {
		global.location.href = 'http://example.com/';

		const { getByText, queryByText } = render( <SetupLayout />, {
			registry,
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		expect( getByText( 'Default module setup' ) ).toBeInTheDocument();
		expect(
			queryByText( 'Express setup component' )
		).not.toBeInTheDocument();
	} );

	it( 'renders DefaultModuleSetup when expressSetup is false', () => {
		global.location.href = 'http://example.com/?expressSetup=false';

		const { getByText, queryByText } = render( <SetupLayout />, {
			registry,
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		expect( getByText( 'Default module setup' ) ).toBeInTheDocument();
		expect(
			queryByText( 'Express setup component' )
		).not.toBeInTheDocument();
	} );

	it( 'renders the express setup flow when expressSetup=true', () => {
		global.location.href = 'http://example.com/?expressSetup=true';

		const { container, getByText, queryByText } = render( <SetupLayout />, {
			registry,
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		expect( getByText( 'Express setup component' ) ).toBeInTheDocument();
		expect( queryByText( 'Default module setup' ) ).not.toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-header' )
		).toBeInTheDocument();
		expect( getByText( 'Exit setup' ) ).toBeInTheDocument();
	} );
} );

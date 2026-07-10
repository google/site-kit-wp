/**
 * DefaultModuleSetup component tests.
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
import {
	createTestRegistry,
	provideModules,
	render,
} from '@tests/js/test-utils';
import DefaultModuleSetup from './DefaultModuleSetup';

describe( 'DefaultModuleSetup', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		provideModules( registry );
	} );

	it( 'should render the standard module setup screen', () => {
		registry.dispatch( CORE_MODULES ).registerModule( 'test-module', {
			storeName: 'modules/test-module',
			SetupComponent: () => <div>Test module setup component</div>,
		} );

		const { container, getByText } = render(
			<DefaultModuleSetup moduleSlug="test-module" />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MODULE_SETUP,
			}
		);

		expect(
			getByText( 'Test module setup component' )
		).toBeInTheDocument();
		expect( getByText( 'Connect Service' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-header' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-help-menu__button' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-setup__footer' )
		).toBeInTheDocument();
	} );
} );

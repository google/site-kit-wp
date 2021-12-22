/**
 * ModuleIcon component tests.
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
import {
	createTestRegistry,
	provideModules,
	render,
} from '../../../tests/js/test-utils';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import ModuleIcon from './ModuleIcon';
import AdsenseIcon from '../../svg/graphics/adsense.svg';

describe( 'Module Icon', () => {
	let registry;
	const moduleName = 'test-module';

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
	} );

	it( "renders nothing when the module doesn't have icon", () => {
		registry.dispatch( CORE_MODULES ).registerModule( moduleName );
		const { container } = render( <ModuleIcon slug={ moduleName } />, {
			registry,
		} );

		expect( container.firstChild ).toBeNull();
	} );

	it( 'renders svg when the module has icon', () => {
		registry
			.dispatch( CORE_MODULES )
			.registerModule( moduleName, { Icon: AdsenseIcon } );
		const { container } = render( <ModuleIcon slug={ moduleName } />, {
			registry,
		} );

		expect( container.querySelector( 'svg' ) ).toBeInTheDocument();
	} );
} );

/**
 * ModuleSetupFooter component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import ModuleSetupFooter from './ModuleSetupFooter';
import {
	createTestRegistry,
	render,
	provideModules,
} from '../../../../tests/js/test-utils';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';

describe( 'ModuleSetupFooter', () => {
	let registry;
	const slug = 'test-module';
	const storeName = `test/${ slug }`;
	const module = {
		slug,
		storeName,
	};
	let validateIsSetupBlockedError = false;

	beforeEach( () => {
		registry = createTestRegistry();

		registry.registerStore(
			storeName,
			Modules.createModuleStore( slug, {
				storeName,
				validateIsSetupBlocked: () => {
					if ( validateIsSetupBlockedError ) {
						throw new Error( validateIsSetupBlockedError );
					}
				},
			} )
		);

		registry.dispatch( CORE_MODULES ).registerModule( slug, { storeName } );

		provideModules( registry );
	} );

	it.each( [
		[ 'Cancel', 'is', false ],
		[ 'Back', 'is not', true ],
	] )(
		'should render the %s label when setup %s blocked',
		( label, _, isBlocked ) => {
			validateIsSetupBlockedError = isBlocked;
			const { container } = render(
				<ModuleSetupFooter module={ module } onCancel={ () => {} } />,
				{
					registry,
				}
			);

			expect(
				container.querySelector( `#setup-${ slug }-cancel` ).textContent
			).toEqual( label );
		}
	);
} );

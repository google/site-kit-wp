/**
 * StepSurveyCTA component tests.
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
import { Registry } from '@/js/googlesitekit-data';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	render,
} from '@tests/js/test-utils';
import StepSurveyCTA from './StepSurveyCTA';

describe( 'StepSurveyCTA', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		const moduleData = [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: true,
			},
		];

		provideModules( registry, moduleData );
		provideModuleRegistrations( registry, moduleData );
	} );

	it( 'calls the complete callback on form submission', () => {
		const onComplete = jest.fn();

		const { getByRole } = render(
			<StepSurveyCTA onComplete={ onComplete } />,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'Continue' } ) );

		expect( onComplete ).toHaveBeenCalledTimes( 1 );
	} );
} );

/**
 * StepSurveyQuestions component tests.
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
	act,
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	render,
} from '@tests/js/test-utils';
import StepSurveyQuestions from './StepSurveyQuestions';

describe( 'StepSurveyQuestions', () => {
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

	it( 'renders a back action that calls the back callback', () => {
		const onGoBack = jest.fn();
		const onComplete = jest.fn();

		const { getByRole } = render(
			<StepSurveyQuestions
				onComplete={ onComplete }
				onGoBack={ onGoBack }
			/>,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'Back' } ) );

		expect( onGoBack ).toHaveBeenCalledTimes( 1 );
		expect( onComplete ).not.toHaveBeenCalled();
	} );

	describe( 'submitting the step', () => {
		beforeEach( () => {
			jest.useFakeTimers();
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'disables both actions while the submission is in progress', async () => {
			const { getByRole } = render(
				<StepSurveyQuestions
					onComplete={ () => {} }
					onGoBack={ () => {} }
				/>,
				{ registry }
			);

			const backButton = getByRole( 'button', { name: 'Back' } );
			const nextButton = getByRole( 'button', { name: 'Next' } );

			expect( backButton ).toBeEnabled();
			expect( nextButton ).toBeEnabled();

			fireEvent.click( nextButton );

			expect( backButton ).toBeDisabled();
			expect( nextButton ).toBeDisabled();

			// Let the pending submission settle before the test ends.
			await act( async () => {
				await jest.runAllTimersAsync();
			} );
		} );
	} );
} );

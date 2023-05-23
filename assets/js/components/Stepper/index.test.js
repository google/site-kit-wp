/**
 * Stepper component tests.
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
 * Internal dependencies
 */
import { render } from '../../../../tests/js/test-utils';
import Step from './Step';
import Stepper from '.';

describe( 'Stepper', () => {
	it( 'should render the active step content', () => {
		const { container, rerender } = render(
			<Stepper activeStep={ 0 }>
				<Step title="Step 1">This is step 1.</Step>
				<Step title="Step 2">This is step 2.</Step>
			</Stepper>
		);

		expect( container ).toMatchSnapshot();

		expect(
			container.querySelector(
				'.googlesitekit-stepper__step:nth-child(1) .googlesitekit-step__content'
			)
		).toBeInTheDocument();

		expect(
			container.querySelector(
				'.googlesitekit-stepper__step:nth-child(2) .googlesitekit-step__content'
			)
		).not.toBeInTheDocument();

		rerender(
			<Stepper activeStep={ 1 }>
				<Step title="Step 1">This is step 1.</Step>
				<Step title="Step 2">This is step 2.</Step>
			</Stepper>
		);

		expect( container ).toMatchSnapshot();

		expect(
			container.querySelector(
				'.googlesitekit-stepper__step:nth-child(1) .googlesitekit-step__content'
			)
		).not.toBeInTheDocument();

		expect(
			container.querySelector(
				'.googlesitekit-stepper__step:nth-child(2) .googlesitekit-step__content'
			)
		).toBeInTheDocument();
	} );
} );

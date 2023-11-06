/**
 * EnhancedMeasurementSwitch tests.
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
import { render } from '../../../../../../tests/js/test-utils';
import EnhancedMeasurementSwitch from './EnhancedMeasurementSwitch';

describe( 'EnhancedMeasurementSwitch', () => {
	it( 'should render correctly in the default state', () => {
		const { container, getByLabelText, queryByText } = render(
			<EnhancedMeasurementSwitch />
		);

		expect( container ).toMatchSnapshot();

		expect(
			getByLabelText( 'Enable enhanced measurement' )
		).toBeInTheDocument();

		expect(
			queryByText(
				'Enhanced measurement is enabled for this web data stream'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should render correctly in the loading state', () => {
		const { container, getByRole } = render(
			<EnhancedMeasurementSwitch loading />
		);

		expect( container ).toMatchSnapshot();

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should render correctly in the disabled state', () => {
		const { container, getByLabelText } = render(
			<EnhancedMeasurementSwitch disabled />
		);

		expect( container ).toMatchSnapshot();

		expect(
			getByLabelText( 'Enable enhanced measurement' )
		).toBeDisabled();
	} );

	it( 'should render correctly in the already enabled state', () => {
		const { container, queryByLabelText, getByText } = render(
			<EnhancedMeasurementSwitch isEnhancedMeasurementAlreadyEnabled />
		);

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				'Enhanced measurement is enabled for this web data stream'
			)
		).toBeInTheDocument();

		expect(
			queryByLabelText( 'Enable enhanced measurement' )
		).not.toBeInTheDocument();
	} );

	it( 'should toggle the switch on click', () => {
		const { getByLabelText } = render( <EnhancedMeasurementSwitch /> );

		const switchControl = getByLabelText( 'Enable enhanced measurement' );

		expect( switchControl ).not.toBeChecked();

		switchControl.click();

		expect( switchControl ).toBeChecked();

		// Give it another click to verify it can be toggled off.
		switchControl.click();

		expect( switchControl ).not.toBeChecked();
	} );

	it( 'should invoke the onClick callback when clicked', () => {
		const onClick = jest.fn();

		const { getByLabelText } = render(
			<EnhancedMeasurementSwitch onClick={ onClick } />
		);

		const switchControl = getByLabelText( 'Enable enhanced measurement' );

		switchControl.click();

		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );
} );

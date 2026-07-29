/**
 * CreateAccountField component tests.
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
import { fireEvent, render } from '@tests/js/test-utils';
import CreateAccountField from './CreateAccountField';

describe( 'CreateAccountField', () => {
	it( 'should render nothing until a default value is available', () => {
		const { container } = render(
			<CreateAccountField
				label="Account"
				name="account"
				hasError={ false }
				value={ undefined }
				setValue={ () => {} }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render the label and value with no error state when `hasError` is false', () => {
		const { container, getByRole, queryByText } = render(
			<CreateAccountField
				label="Account"
				name="account"
				hasError={ false }
				value="Existing Account"
				setValue={ () => {} }
			/>
		);

		const input = getByRole( 'textbox', { name: 'Account' } );

		expect( input ).toHaveValue( 'Existing Account' );
		expect(
			container
				.querySelector( '.mdc-text-field' )
				?.classList.contains( 'mdc-text-field--error' )
		).toBe( false );
		expect( input ).not.toHaveAttribute( 'aria-invalid' );
		expect( queryByText( 'Account is required' ) ).not.toBeInTheDocument();
	} );

	it( 'should show an accessible "{label} is required" error when `hasError` is true', () => {
		const { container, getByRole, getByText } = render(
			<CreateAccountField
				label="Property"
				name="property"
				value=""
				setValue={ () => {} }
				hasError
			/>
		);

		const input = getByRole( 'textbox', { name: 'Property' } );

		expect(
			container
				.querySelector( '.mdc-text-field' )
				?.classList.contains( 'mdc-text-field--error' )
		).toBe( true );
		expect( input ).toHaveAttribute( 'aria-invalid', 'true' );

		const requiredMessage = getByText( 'Property is required' );

		expect( requiredMessage ).toBeInTheDocument();
		expect( input ).toHaveAttribute(
			'aria-errormessage',
			requiredMessage.getAttribute( 'id' )
		);
	} );

	it( 'should call `setValue` with the new value and field name on change', () => {
		const setValue = jest.fn();

		const { getByRole } = render(
			<CreateAccountField
				label="Account"
				name="account"
				hasError={ false }
				value=""
				setValue={ setValue }
			/>
		);

		fireEvent.change( getByRole( 'textbox', { name: 'Account' } ), {
			target: { value: 'New Account' },
		} );

		expect( setValue ).toHaveBeenCalledWith( 'New Account', 'account' );
	} );
} );

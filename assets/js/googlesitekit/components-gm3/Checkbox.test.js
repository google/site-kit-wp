/**
 * Checkbox tests.
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
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { fireEvent, render } from '../../../../tests/js/test-utils';
import Checkbox from './Checkbox';

describe( 'Checkbox', () => {
	it( 'should render the checkbox', async () => {
		const { container, getByRole } = render(
			<Checkbox
				id="checkbox-id"
				name="checkbox-name"
				value="checkbox-value"
				onChange={ () => {} }
			>
				Checkbox Label
			</Checkbox>
		);

		const checkbox = getByRole( 'checkbox' );

		await checkbox.updateComplete;

		expect( container ).toMatchSnapshot();

		const input = checkbox.shadowRoot.querySelector( 'input' );

		// Verify that the name and value attributes are passed through to the underlying input element.
		expect( input ).toHaveAttribute( 'name', 'checkbox-name' );
		expect( input ).toHaveAttribute( 'value', 'checkbox-value' );

		// Verify that the underlying input element is not checked or disabled.
		expect( input ).not.toHaveAttribute( 'checked' );
		expect( input ).not.toHaveAttribute( 'disabled' );
	} );

	it( 'should render the checkbox with checked state', async () => {
		const { container, getByRole } = render(
			<Checkbox
				id="checkbox-id"
				name="checkbox-name"
				value="checkbox-value"
				onChange={ () => {} }
				checked
			>
				Checkbox Label
			</Checkbox>
		);

		const checkbox = getByRole( 'checkbox' );

		await checkbox.updateComplete;

		expect( container ).toMatchSnapshot();

		const input = checkbox.shadowRoot.querySelector( 'input' );

		// Verify that the checked attribute is passed through to the underlying input element.
		expect( input ).toHaveAttribute( 'checked' );
	} );

	it( 'should render the checkbox with disabled state', async () => {
		const { container, getByRole } = render(
			<Checkbox
				id="checkbox-id"
				name="checkbox-name"
				value="checkbox-value"
				onChange={ () => {} }
				disabled
			>
				Checkbox Label
			</Checkbox>
		);

		const checkbox = getByRole( 'checkbox' );

		await checkbox.updateComplete;

		expect( container ).toMatchSnapshot();

		const input = checkbox.shadowRoot.querySelector( 'input' );

		// Verify that the disabled attribute is passed through to the underlying input element.
		expect( input ).toHaveAttribute( 'disabled' );
	} );

	it( 'should render the checkbox with loading state', () => {
		const { container } = render(
			<Checkbox
				id="checkbox-id"
				name="checkbox-name"
				value="checkbox-value"
				onChange={ () => {} }
				loading
			>
				Checkbox Label
			</Checkbox>
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the checkbox with a complex label', async () => {
		const { container, getByRole } = render(
			<Checkbox
				id="checkbox-id"
				name="checkbox-name"
				value="checkbox-value"
				onChange={ () => {} }
			>
				<div>
					Complex Label
					<span>
						<a href="https://example.com"> With</a>
						<span>{ 5 }</span>
					</span>
					<span>
						Sub<span>&nbsp;Children </span>
					</span>
				</div>
			</Checkbox>
		);

		await getByRole( 'checkbox' ).updateComplete;

		expect( container ).toMatchSnapshot();
		expect(
			container
				.querySelector( 'md-checkbox' )
				.getAttribute( 'data-aria-label' )
		).toBe( 'Complex Label With 5 Sub Children' );
	} );

	it( 'should attach the onKeyDown handler when present', () => {
		const onKeyDown = jest.fn();

		const { getByRole } = render(
			<Checkbox
				id="checkbox-id"
				name="checkbox-name"
				value="checkbox-value"
				onChange={ () => {} }
				onKeyDown={ onKeyDown }
			>
				Checkbox Label
			</Checkbox>
		);

		fireEvent.keyDown( getByRole( 'checkbox' ), {
			key: 'Enter',
			keyCode: 13,
		} );

		expect( onKeyDown ).toHaveBeenCalledTimes( 1 );
		expect( onKeyDown ).toHaveBeenCalledWith(
			expect.objectContaining( {
				key: 'Enter',
				keyCode: 13,
			} )
		);
	} );

	describe.each( [
		[
			// Clickable element for test description:
			'input',
			// Function to retrieve the clickable element:
			( { getByRole } ) =>
				getByRole( 'checkbox' ).shadowRoot.querySelector( 'input' ),
		],
		[
			// Clickable element for test description:
			'label',
			// Function to retrieve the clickable element:
			( { getByText } ) => getByText( 'Checkbox Label' ),
		],
	] )(
		'controlled input behaviour for %s',
		( clickableElement, getClickableElement ) => {
			function createOnChangeSpy() {
				// We need to explicitly track the `checked` state at the time the `onChange` handler was called.
				// It's not sufficient to simply check `onChange.mock.calls[...]`, as `event.target.checked` may have
				// changed by the time the value is examined.
				const onChangeCalls = [];
				const onChange = jest.fn( ( event ) => {
					onChangeCalls.push( { checked: event.target.checked } );
				} );
				return { onChange, onChangeCalls };
			}

			function expectCheckboxToBeChecked( checkbox ) {
				expect( checkbox ).toHaveAttribute( 'checked' );

				// Explicitly check the `checked` attribute of the underlying input element. This is
				// worthwhile as we are explicitly reaching into the shadow DOM to update the input within
				// the Checkbox component.
				expect(
					checkbox.shadowRoot.querySelector( 'input' )
				).toHaveAttribute( 'checked' );
			}

			function expectCheckboxNotToBeChecked( checkbox ) {
				expect( checkbox ).not.toHaveAttribute( 'checked' );
				expect(
					checkbox.shadowRoot.querySelector( 'input' )
				).not.toHaveAttribute( 'checked' );
			}

			it( 'should correctly invoke onChange and retain its unchecked state when clicked', async () => {
				const { onChange, onChangeCalls } = createOnChangeSpy();
				const result = render(
					<Checkbox
						id="checkbox-id"
						name="checkbox-name"
						value="checkbox-value"
						onChange={ onChange }
					>
						Checkbox Label
					</Checkbox>
				);

				const { container, getByRole } = result;

				await getByRole( 'checkbox' ).updateComplete;

				expect( container ).toMatchSnapshot();

				// Confirm the checkbox is not checked.
				expectCheckboxNotToBeChecked( getByRole( 'checkbox' ) );

				fireEvent.click( getClickableElement( result ) );

				await getByRole( 'checkbox' ).updateComplete;

				expect( container ).toMatchSnapshot();

				// Confirm the click resulted in a change event with target.checked: true.
				expect( onChange ).toHaveBeenCalledTimes( 1 );
				expect( onChangeCalls[ 0 ].checked ).toBe( true );

				// Confirm the checkbox remains unchecked as its state is controlled.
				expectCheckboxNotToBeChecked( getByRole( 'checkbox' ) );
			} );

			it( 'should correctly invoke onChange and retain its checked state when clicked', async () => {
				const { onChange, onChangeCalls } = createOnChangeSpy();
				const result = render(
					<Checkbox
						id="checkbox-id"
						name="checkbox-name"
						value="checkbox-value"
						checked
						onChange={ onChange }
					>
						Checkbox Label
					</Checkbox>
				);

				const { container, getByRole } = result;

				await getByRole( 'checkbox' ).updateComplete;

				expect( container ).toMatchSnapshot();

				// Confirm the checkbox is checked.
				expectCheckboxToBeChecked( getByRole( 'checkbox' ) );

				fireEvent.click( getClickableElement( result ) );

				await getByRole( 'checkbox' ).updateComplete;

				expect( container ).toMatchSnapshot();

				// Confirm the click resulted in a change event with target.checked: false.
				expect( onChange ).toHaveBeenCalledTimes( 1 );
				expect( onChangeCalls[ 0 ].checked ).toBe( false );

				// Confirm the checkbox remains checked as its state is controlled.
				expectCheckboxToBeChecked( getByRole( 'checkbox' ) );
			} );

			it( 'should allow updating of the checked state', async () => {
				function CheckableCheckbox( { onChange } ) {
					const [ checked, setChecked ] = useState( false );

					return (
						<Checkbox
							id="checkbox-id"
							name="checkbox-name"
							value="checkbox-value"
							checked={ checked }
							onChange={ ( event ) => {
								onChange( event );
								setChecked( event.target.checked );
							} }
						>
							Checkbox Label
						</Checkbox>
					);
				}

				const { onChange, onChangeCalls } = createOnChangeSpy();
				const result = render(
					<CheckableCheckbox onChange={ onChange } />
				);

				const { container, getByRole } = result;

				await getByRole( 'checkbox' ).updateComplete;

				expect( container ).toMatchSnapshot();

				// Confirm the checkbox is not checked.
				expectCheckboxNotToBeChecked( getByRole( 'checkbox' ) );

				fireEvent.click( getClickableElement( result ) );

				await getByRole( 'checkbox' ).updateComplete;

				expect( container ).toMatchSnapshot();

				// Confirm the click resulted in a change event with target.checked: true.
				expect( onChange ).toHaveBeenCalledTimes( 1 );
				expect( onChangeCalls[ 0 ].checked ).toBe( true );

				// Confirm the checkbox is now checked
				expectCheckboxToBeChecked( getByRole( 'checkbox' ) );

				// Click again to uncheck
				onChangeCalls.length = 0;
				onChange.mockClear();

				fireEvent.click( getClickableElement( result ) );

				await getByRole( 'checkbox' ).updateComplete;

				expect( container ).toMatchSnapshot();

				// Confirm the click resulted in a change event with target.checked: false.
				expect( onChange ).toHaveBeenCalledTimes( 1 );
				expect( onChangeCalls[ 0 ].checked ).toBe( false );

				// Confirm the checkbox is now unchecked
				expectCheckboxNotToBeChecked( getByRole( 'checkbox' ) );
			} );
		}
	);
} );

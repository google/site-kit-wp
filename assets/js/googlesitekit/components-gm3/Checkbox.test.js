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
		const { container, getByLabelText } = render(
			<Checkbox
				id="checkbox-id"
				name="checkbox-name"
				value="checkbox-value"
				onChange={ () => {} }
			>
				Checkbox Label
			</Checkbox>
		);

		const checkbox = getByLabelText( 'Checkbox Label' );

		await checkbox.updateComplete;

		expect( container ).toMatchSnapshot();

		// Verify that the value attribute is retained as a property.
		expect( checkbox.value ).toBe( 'checkbox-value' );

		const input = checkbox.shadowRoot.querySelector( 'input' );

		// Verify that the underlying input element is not checked or disabled.
		expect( input.checked ).toBe( false );
		expect( input.disabled ).toBe( false );
	} );

	it( 'should render the checkbox with checked state', async () => {
		const { getByLabelText } = render(
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

		const checkbox = getByLabelText( 'Checkbox Label' );

		await checkbox.updateComplete;

		// TODO: There is a glitch when rendering the checked Checkbox resulting in an additional `input` element rendered to the JSDom, which is not present in the browser.
		// This makes for a bit of a confusing snapshot, so it has been removed.
		// When updating related packages (Jest, JSDom, @material/web, @lit-labs/react, etc), keep an eye out for this to be fixed and restore the snapshot test.
		// expect( container ).toMatchSnapshot();

		// Verify that the checked state is stored as a property.
		expect( checkbox.checked ).toBe( true );

		const input = checkbox.shadowRoot.querySelector( 'input' );

		// Verify that the checked state is passed through to the underlying input element.
		expect( input.checked ).toBe( true );
	} );

	it( 'should render the checkbox with disabled state', async () => {
		const { container, getByLabelText } = render(
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

		const checkbox = getByLabelText( 'Checkbox Label' );

		await checkbox.updateComplete;

		expect( container ).toMatchSnapshot();

		const input = checkbox.shadowRoot.querySelector( 'input' );

		// Verify that the disabled state is passed through to the underlying input element.
		expect( input.disabled ).toBe( true );
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
		const { container, getByLabelText } = render(
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

		const expectedLabelText = 'Complex Label With 5 Sub Children';

		await getByLabelText( expectedLabelText ).updateComplete;

		expect( container ).toMatchSnapshot();
		expect(
			container
				.querySelector( 'md-checkbox' )
				.getAttribute( 'aria-label' )
		).toBe( expectedLabelText );
	} );

	it( 'should attach the onKeyDown handler when present', () => {
		const onKeyDown = jest.fn();

		const { getByLabelText } = render(
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

		fireEvent.keyDown( getByLabelText( 'Checkbox Label' ), {
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
			( { getByLabelText } ) =>
				getByLabelText( 'Checkbox Label' ).shadowRoot.querySelector(
					'input'
				),
		],
		// TODO: Restore the label tests, either when JSDom supports the :focus-visible selector,
		// or when the @material/web md-checkbox no longer makes use of it during these tests.
		// References:
		// - https://github.com/jsdom/jsdom/issues/3426
		// - https://github.com/material-components/material-web/blob/f9da93553bd64e7e8475f8acb8ee12206af12ac4/focus/lib/focus-ring.ts#L66
		// [
		// 	// Clickable element for test description:
		// 	'label',
		// 	// Function to retrieve the clickable element:
		// 	( { getByText } ) => getByText( 'Checkbox Label' ),
		// ],
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
				expect( checkbox.checked ).toBe( true );

				// Explicitly check the `checked` attribute of the underlying input element. This is
				// worthwhile as we are explicitly reaching into the shadow DOM to update the input within
				// the Checkbox component.
				expect(
					checkbox.shadowRoot.querySelector( 'input' ).checked
				).toBe( true );
			}

			function expectCheckboxNotToBeChecked( checkbox ) {
				expect( checkbox.checked ).toBe( false );
				expect(
					checkbox.shadowRoot.querySelector( 'input' ).checked
				).toBe( false );
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

				const { container, getByLabelText } = result;

				await getByLabelText( 'Checkbox Label' ).updateComplete;

				expect( container ).toMatchSnapshot();

				// Confirm the checkbox is not checked.
				expectCheckboxNotToBeChecked(
					getByLabelText( 'Checkbox Label' )
				);

				expect( onChange ).toHaveBeenCalledTimes( 0 );

				fireEvent.click( getClickableElement( result ) );

				await getByLabelText( 'Checkbox Label' ).updateComplete;

				expect( container ).toMatchSnapshot();

				// Confirm the click resulted in a change event with target.checked: true.
				expect( onChange ).toHaveBeenCalledTimes( 1 );
				expect( onChangeCalls[ 0 ].checked ).toBe( true );

				// Confirm the checkbox remains unchecked as its state is controlled.
				expectCheckboxNotToBeChecked(
					getByLabelText( 'Checkbox Label' )
				);
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

				const { getByLabelText } = result;

				await getByLabelText( 'Checkbox Label' ).updateComplete;

				// TODO: There is a glitch when rendering the checked Checkbox resulting in an additional `input` element rendered to the JSDom, which is not present in the browser.
				// This makes for a bit of a confusing snapshot, so it has been removed, as has the second snapshot assertion below.
				// When updating related packages (Jest, JSDom, @material/web, @lit-labs/react, etc), keep an eye out for this to be fixed and restore the snapshot tests.
				// expect( container ).toMatchSnapshot();

				// Confirm the checkbox is checked.
				expectCheckboxToBeChecked( getByLabelText( 'Checkbox Label' ) );

				fireEvent.click( getClickableElement( result ) );

				await getByLabelText( 'Checkbox Label' ).updateComplete;

				// expect( container ).toMatchSnapshot();

				// Confirm the click resulted in a change event with target.checked: false.
				expect( onChange ).toHaveBeenCalledTimes( 1 );
				expect( onChangeCalls[ 0 ].checked ).toBe( false );

				// Confirm the checkbox remains checked as its state is controlled.
				expectCheckboxToBeChecked( getByLabelText( 'Checkbox Label' ) );
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

				const { container, getByLabelText } = result;

				await getByLabelText( 'Checkbox Label' ).updateComplete;

				expect( container ).toMatchSnapshot();

				// Confirm the checkbox is not checked.
				expectCheckboxNotToBeChecked(
					getByLabelText( 'Checkbox Label' )
				);

				fireEvent.click( getClickableElement( result ) );

				await getByLabelText( 'Checkbox Label' ).updateComplete;

				// TODO: There is a glitch when rendering the checked Checkbox resulting in an additional `input` element rendered to the JSDom, which is not present in the browser.
				// This makes for a bit of a confusing snapshot, so it has been removed.
				// When updating related packages (Jest, JSDom, @material/web, @lit-labs/react, etc), keep an eye out for this to be fixed and restore the snapshot test.
				// expect( container ).toMatchSnapshot();

				// Confirm the click resulted in a change event with target.checked: true.
				expect( onChange ).toHaveBeenCalledTimes( 1 );
				expect( onChangeCalls[ 0 ].checked ).toBe( true );

				// Confirm the checkbox is now checked
				expectCheckboxToBeChecked( getByLabelText( 'Checkbox Label' ) );

				// Click again to uncheck
				onChangeCalls.length = 0;
				onChange.mockClear();

				fireEvent.click( getClickableElement( result ) );

				await getByLabelText( 'Checkbox Label' ).updateComplete;

				expect( container ).toMatchSnapshot();

				// Confirm the click resulted in a change event with target.checked: false.
				expect( onChange ).toHaveBeenCalledTimes( 1 );
				expect( onChangeCalls[ 0 ].checked ).toBe( false );

				// Confirm the checkbox is now unchecked
				expectCheckboxNotToBeChecked(
					getByLabelText( 'Checkbox Label' )
				);
			} );
		}
	);

	it( 'should render the checkbox with a description', () => {
		const { container } = render(
			<Checkbox
				id="checkbox-id"
				name="checkbox-name"
				value="checkbox-value"
				onChange={ () => {} }
				description="Checkbox description"
			>
				Checkbox Label
			</Checkbox>
		);

		expect( container ).toMatchSnapshot();

		expect(
			container.querySelector(
				'.googlesitekit-component-gm3_checkbox__description'
			)
		).toHaveTextContent( 'Checkbox description' );
	} );
} );

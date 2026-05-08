/**
 * SpinnerButton tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { fireEvent, render } from '../../../../tests/js/test-utils';
import SpinnerButton, { SPINNER_POSITION } from './SpinnerButton';

describe( 'SpinnerButton', () => {
	it( 'should render a button without a spinner when not saving', () => {
		const { container, getByRole } = render(
			// @ts-expect-error - The `SpinnerButton` component is not typed yet.
			<SpinnerButton isSaving={ false }>Button text</SpinnerButton>
		);

		expect( container ).toMatchSnapshot();

		expect(
			getByRole( 'button', { name: 'Button text' } )
		).toBeInTheDocument();
		expect( container.querySelector( 'svg' ) ).not.toBeInTheDocument();
	} );

	it( 'should render a button with a spinner after the text when saving and `spinnerPosition` is not provided', () => {
		const { container, getByRole } = render(
			// @ts-expect-error - The `SpinnerButton` component is not typed yet.
			<SpinnerButton isSaving>Button text</SpinnerButton>
		);

		expect( container ).toMatchSnapshot();

		const button = getByRole( 'button', {
			name: 'Button text',
		} );

		expect( button ).toBeInTheDocument();
		expect( button ).toHaveClass(
			'googlesitekit-button-icon--spinner__after'
		);
		expect( container.querySelector( 'svg' ) ).toBeInTheDocument();
	} );

	it( 'should render a button with a spinner before the text when `spinnerPosition` is `before`', () => {
		const { container, getByRole } = render(
			// @ts-expect-error - The `SpinnerButton` component is not typed yet.
			<SpinnerButton spinnerPosition={ SPINNER_POSITION.BEFORE } isSaving>
				Button text
			</SpinnerButton>
		);

		expect( container ).toMatchSnapshot();

		const button = getByRole( 'button', {
			name: 'Button text',
		} );

		expect( button ).toBeInTheDocument();
		expect( button ).toHaveClass(
			'googlesitekit-button-icon--spinner__before'
		);
		expect( container.querySelector( 'svg' ) ).toBeInTheDocument();
	} );

	it( 'should render a button with a spinner after the text when `spinnerPosition` is `after`', () => {
		const { container, getByRole } = render(
			// @ts-expect-error - The `SpinnerButton` component is not typed yet.
			<SpinnerButton spinnerPosition={ SPINNER_POSITION.AFTER } isSaving>
				Button text
			</SpinnerButton>
		);

		expect( container ).toMatchSnapshot();

		const button = getByRole( 'button', {
			name: 'Button text',
		} );

		expect( button ).toBeInTheDocument();
		expect( button ).toHaveClass(
			'googlesitekit-button-icon--spinner__after'
		);
		expect( container.querySelector( 'svg' ) ).toBeInTheDocument();
	} );

	it( 'should invoke the `onClick` callback when the button is clicked', () => {
		const onClick = jest.fn();

		const { getByRole } = render(
			// @ts-expect-error - The `SpinnerButton` component is not typed yet.
			<SpinnerButton onClick={ onClick }>Button text</SpinnerButton>
		);

		const button = getByRole( 'button', { name: 'Button text' } );

		fireEvent.click( button );

		expect( onClick ).toHaveBeenCalled();
	} );

	it( 'should pass additional props to the button', () => {
		const { getByRole } = render(
			// @ts-expect-error - The `SpinnerButton` component is not typed yet.
			<SpinnerButton data-test="test-value">Button text</SpinnerButton>
		);

		expect(
			getByRole( 'button', { name: 'Button text' } )
		).toHaveAttribute( 'data-test', 'test-value' );
	} );

	it.each( [
		[
			'icon',
			SPINNER_POSITION.BEFORE,
			'googlesitekit-button-icon--spinner__before',
		],
		[
			'trailingIcon',
			SPINNER_POSITION.AFTER,
			'googlesitekit-button-icon--spinner__after',
		],
	] )(
		"should not allow the `%s` prop, when passed as `undefined` to `SpinnerButton`, to prevent the spinner being rendered when `isSaving` is `true` and `spinnerPosition` is '%s'",
		( propName, spinnerPosition, expectedClass ) => {
			const undefinedProps = {
				[ propName ]: undefined,
			};
			const { container, getByRole } = render(
				// @ts-expect-error - The `SpinnerButton` component is not typed yet.
				<SpinnerButton
					spinnerPosition={ spinnerPosition }
					isSaving
					{ ...undefinedProps }
				>
					Button text
				</SpinnerButton>
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
			) as any;

			const button = getByRole( 'button', {
				name: 'Button text',
			} );

			expect( button ).toBeInTheDocument();
			expect( button ).toHaveClass( expectedClass );
			expect( container.querySelector( 'svg' ) ).toBeInTheDocument();
		}
	);
} );

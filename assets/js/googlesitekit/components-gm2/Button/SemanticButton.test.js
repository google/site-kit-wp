/**
 * SemanticButton tests.
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
import { fireEvent, render } from '../../../../../tests/js/test-utils';
import SemanticButton from './SemanticButton';

describe( 'SemanticButton', () => {
	it( 'should render as a button by default', () => {
		const { container } = render( <SemanticButton>Test</SemanticButton> );
		expect( container.querySelector( 'button' ) ).toBeInTheDocument();
		expect( container.querySelector( 'a' ) ).not.toBeInTheDocument();
	} );

	it( 'should render as an anchor when href is provided', () => {
		const { container } = render(
			<SemanticButton href="https://example.com">Test</SemanticButton>
		);
		expect( container.querySelector( 'a' ) ).toBeInTheDocument();
		expect( container.querySelector( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'should render as a button when disabled even with href', () => {
		const { container } = render(
			<SemanticButton href="https://example.com" disabled>
				Test
			</SemanticButton>
		);
		expect( container.querySelector( 'button' ) ).toBeInTheDocument();
		expect( container.querySelector( 'a' ) ).not.toBeInTheDocument();
	} );

	it( 'should not render label span when no children', () => {
		const { container } = render( <SemanticButton /> );
		expect(
			container.querySelector( '.mdc-button__label' )
		).not.toBeInTheDocument();
	} );

	describe( 'class application', () => {
		it.each( [
			[ 'danger', 'mdc-button--danger' ],
			[ 'inverse', 'mdc-button--inverse' ],
			[ 'tertiary', 'mdc-button--tertiary' ],
		] )(
			'should apply %s class when %s prop is true',
			( prop, className ) => {
				const props = { [ prop ]: true };
				const { container } = render(
					<SemanticButton { ...props }>Test</SemanticButton>
				);
				expect( container.firstChild ).toHaveClass( className );
			}
		);

		it( 'should apply callout classes when callout props are set', () => {
			const { container } = render(
				<SemanticButton callout calloutStyle="warning">
					Test
				</SemanticButton>
			);
			expect( container.firstChild ).toHaveClass( 'mdc-button--callout' );
			expect( container.firstChild ).toHaveClass(
				'mdc-button--callout-warning'
			);
		} );
	} );

	it( 'should pass through additional props', () => {
		const onClick = jest.fn();
		const { getByRole } = render(
			<SemanticButton onClick={ onClick } data-test="test-value">
				Test
			</SemanticButton>
		);
		const button = getByRole( 'button' );

		fireEvent.click( button );
		expect( onClick ).toHaveBeenCalled();
		expect( button ).toHaveAttribute( 'data-test', 'test-value' );
	} );

	it( 'should set role="button" when rendered as anchor', () => {
		const { container } = render(
			<SemanticButton href="https://example.com">Test</SemanticButton>
		);
		expect( container.querySelector( 'a' ) ).toHaveAttribute(
			'role',
			'button'
		);
	} );

	it( 'should not set role when rendered as button', () => {
		const { container } = render( <SemanticButton>Test</SemanticButton> );
		expect( container.querySelector( 'button' ) ).not.toHaveAttribute(
			'role'
		);
	} );
} );

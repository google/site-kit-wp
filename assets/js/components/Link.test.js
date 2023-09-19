/**
 * Link component tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { render } from '../../../tests/js/test-utils';
import Link from './Link';

describe( 'Link', () => {
	describe( 'aria-label', () => {
		it( 'does not have an aria-label by default', () => {
			const { container } = render( <Link>text content</Link> );

			expect( container.firstChild ).not.toHaveAttribute( 'aria-label' );
		} );

		it( 'supports an aria-label prop', () => {
			const { container } = render(
				<Link aria-label="test label">text content</Link>
			);

			expect( container.firstChild ).toHaveAttribute(
				'aria-label',
				'test label'
			);
		} );

		it( 'adds an aria-label with the text content for external links', () => {
			const { container } = render( <Link external>text content</Link> );

			expect( container.firstChild ).toHaveAttribute(
				'aria-label',
				'text content (opens in a new tab)'
			);
		} );

		it( 'appends the new tab text to an external link with an aria-label prop', () => {
			const { container } = render(
				<Link aria-label="label prop" external>
					text content
				</Link>
			);

			expect( container.firstChild ).toHaveAttribute(
				'aria-label',
				'label prop (opens in a new tab)'
			);
		} );

		it( 'adds an aria-label with the text content for disabled links', () => {
			const { container } = render(
				<Link disabled onClick={ () => {} }>
					text content
				</Link>
			);

			expect( container.firstChild ).toHaveAttribute(
				'aria-label',
				'text content (disabled)'
			);
		} );

		it( 'uses the existing aria-label for disabled links', () => {
			const { container } = render(
				<Link aria-label="label prop" disabled onClick={ () => {} }>
					text content
				</Link>
			);

			expect( container.firstChild ).toHaveAttribute(
				'aria-label',
				'label prop (disabled)'
			);
		} );

		it( 'does not build an ARIA label for non-string children', () => {
			const { container } = render(
				<Link external>{ [ 'text content' ] }</Link>
			);

			expect( container.firstChild ).not.toHaveAttribute( 'aria-label' );
		} );

		it( 'does not append anything to the ARIA label when not needed', () => {
			const { container } = render(
				<Link aria-label="foo">text content</Link>
			);

			expect( container.firstChild ).toHaveAttribute(
				'aria-label',
				'foo'
			);
		} );

		it( 'does not set the ARIA label based on children when there is no suffix', () => {
			const { container } = render( <Link>text content</Link> );

			expect( container.firstChild ).not.toHaveAttribute( 'aria-label' );
		} );

		it( 'creates an <a> tag by default', () => {
			const { container } = render( <Link>text content</Link> );

			expect( container.firstChild.tagName ).toEqual( 'A' );
		} );

		it( 'creates an <a> attribute when using the href attribute', () => {
			const { container } = render( <Link href="/">text content</Link> );

			expect( container.firstChild.tagName ).toEqual( 'A' );
		} );

		it( 'creates an <a> attribute even when an onClick prop is supplied', () => {
			const { container } = render(
				<Link href="/" onClick={ () => {} }>
					text content
				</Link>
			);

			expect( container.firstChild.tagName ).toEqual( 'A' );
		} );

		it( 'creates an <a> attribute when using React Router', () => {
			const { container } = render( <Link to="/">text content</Link> );

			expect( container.firstChild.tagName ).toEqual( 'A' );
		} );

		it( 'creates an <a> attribute when using React Router, even when an onClick prop is supplied', () => {
			const { container } = render(
				<Link to="/" onClick={ () => {} }>
					text content
				</Link>
			);

			expect( container.firstChild.tagName ).toEqual( 'A' );
		} );

		it( 'creates a <button> tag when no `href` or `to` prop exists, but `onClick` is set', () => {
			const { container } = render(
				<Link onClick={ () => {} }>text content</Link>
			);

			expect( container.firstChild.tagName ).toEqual( 'BUTTON' );
		} );
	} );

	describe( 'secondary prop', () => {
		it( 'does not have secondary class when secondary prop is not passed', () => {
			const { container } = render(
				<Link onClick={ () => {} }>text content</Link>
			);

			expect( container.firstChild ).not.toHaveClass(
				'googlesitekit-cta-link--secondary'
			);
		} );

		it( 'have secondary class when secondary prop is passed', () => {
			const { container } = render(
				<Link onClick={ () => {} } secondary>
					text content
				</Link>
			);

			expect( container.firstChild ).toHaveClass(
				'googlesitekit-cta-link--secondary'
			);
		} );
	} );
} );

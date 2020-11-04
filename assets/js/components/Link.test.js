/**
 * Link component tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
			const { container } = render( <Link aria-label="test label">text content</Link> );

			expect( container.firstChild ).toHaveAttribute( 'aria-label', 'test label' );
		} );

		it( 'adds an aria-label with the text content for external links', () => {
			const { container } = render( <Link external>text content</Link> );

			expect( container.firstChild ).toHaveAttribute( 'aria-label', 'text content (opens in a new tab)' );
		} );

		it( 'appends the new tab text to an external link with an aria-label prop', () => {
			const { container } = render( <Link aria-label="label prop" external>text content</Link> );

			expect( container.firstChild ).toHaveAttribute( 'aria-label', 'label prop (opens in a new tab)' );
		} );

		it( 'ignores valid non-string children when building an aria-label for an external link', () => {
			const { container } = render( <Link external>{ [ 'text content' ] }</Link> );

			expect( container.firstChild ).toHaveAttribute( 'aria-label', '(opens in a new tab)' );
		} );
	} );
} );

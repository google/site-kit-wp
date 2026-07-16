/**
 * PDFLink tests.
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
 * External dependencies
 */
import { Path, Svg } from '@react-pdf/renderer';
import { ComponentProps } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFLink from './PDFLink';

/**
 * Renders the link and returns the test renderer's JSON tree.
 *
 * @since 1.183.0
 *
 * @param props Props for the link.
 * @return The rendered tree.
 */
function renderLink(
	props: ComponentProps< typeof PDFLink >
): TestRenderer.ReactTestRendererJSON {
	const tree = TestRenderer.create( <PDFLink { ...props } /> ).toJSON();
	if ( ! tree || Array.isArray( tree ) ) {
		throw new Error( 'Unexpected render output.' );
	}
	return tree;
}

describe( 'PDFLink', () => {
	it( 'links to the href with no underline', () => {
		const tree = renderLink( {
			href: 'https://example.com/dashboard',
			children: 'View dashboard',
		} );

		expect( tree.type ).toBe( 'pdf-link' );
		expect( tree.props.src ).toBe( 'https://example.com/dashboard' );
		expect( tree.props.style ).toMatchObject( { textDecoration: 'none' } );
	} );

	it( 'uses the link color when no style sets a color', () => {
		const linkJSON = JSON.stringify(
			renderLink( {
				href: 'https://example.com/dashboard',
				children: 'View dashboard',
			} )
		);

		expect( linkJSON ).toContain( 'View dashboard' );
		expect( linkJSON ).toContain( PDF_COLORS.CONTENT_SECONDARY );
	} );

	it( 'renders the trailing icon after the link text', () => {
		const tree = renderLink( {
			href: 'https://example.com/dashboard',
			trailingIcon: (
				<Svg>
					<Path d="M1 2 3 4" />
				</Svg>
			),
			children: 'View dashboard',
		} );

		// The text and the icon are the two children of the link.
		expect( tree.children ).toHaveLength( 2 );
		expect( JSON.stringify( tree ) ).toContain( 'M1 2 3 4' );
	} );

	it( 'renders only the link text when no icon is passed', () => {
		const tree = renderLink( {
			href: 'https://example.com/dashboard',
			children: 'View dashboard',
		} );

		expect( tree.children ).toHaveLength( 1 );
	} );

	it( 'uses the color from the style prop', () => {
		const linkJSON = JSON.stringify(
			renderLink( {
				href: 'https://example.com/dashboard',
				style: { color: '#6c726e' },
				children: 'View dashboard',
			} )
		);

		expect( linkJSON ).toContain( '#6c726e' );
	} );

	it( 'renders plain text in the default color when the href is empty', () => {
		// An empty `href` is how a caller passes a row that has no link, so
		// the text renders plain instead of as a link.
		const tree = renderLink( { href: '', children: 'View dashboard' } );

		expect( tree.type ).toBe( 'pdf-text' );

		const treeJSON = JSON.stringify( tree );
		expect( treeJSON ).toContain( 'View dashboard' );
		expect( treeJSON ).not.toContain( PDF_COLORS.CONTENT_SECONDARY );
	} );

	it( 'leaves out the trailing icon when the href is empty', () => {
		const tree = renderLink( {
			href: '',
			trailingIcon: (
				<Svg>
					<Path d="M1 2 3 4" />
				</Svg>
			),
			children: 'View dashboard',
		} );

		expect( JSON.stringify( tree ) ).not.toContain( 'M1 2 3 4' );
	} );
} );

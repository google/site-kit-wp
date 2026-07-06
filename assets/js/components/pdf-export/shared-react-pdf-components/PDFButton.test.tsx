/**
 * PDFButton tests.
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
import { ComponentProps } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { PDF_SCALE } from '@/js/components/pdf-export/pdf-scale';
import PDFButton from './PDFButton';

/**
 * Renders the button and returns the test renderer's JSON tree.
 *
 * @since n.e.x.t
 *
 * @param props Props for the button.
 * @return The rendered tree.
 */
function renderButton(
	props: ComponentProps< typeof PDFButton >
): TestRenderer.ReactTestRendererJSON {
	const tree = TestRenderer.create( <PDFButton { ...props } /> ).toJSON();
	if ( ! tree || Array.isArray( tree ) ) {
		throw new Error( 'Unexpected render output.' );
	}
	return tree;
}

describe( 'PDFButton', () => {
	it( 'wraps the whole button in a link to the href', () => {
		const tree = renderButton( {
			href: 'https://example.com/setup',
			backgroundColor: '#462083',
			labelColor: '#ffffff',
			children: 'Set up email reports',
		} );

		expect( tree.type ).toBe( 'pdf-link' );
		expect( tree.props.src ).toBe( 'https://example.com/setup' );
	} );

	it( 'uses the background and label colors from the props', () => {
		const buttonJSON = JSON.stringify(
			renderButton( {
				href: 'https://example.com/setup',
				backgroundColor: '#462083',
				labelColor: '#ffffff',
				children: 'Set up email reports',
			} )
		);

		expect( buttonJSON ).toContain( 'Set up email reports' );
		expect( buttonJSON ).toContain( '"backgroundColor":"#462083"' );
		expect( buttonJSON ).toContain( '#ffffff' );
	} );

	it( 'scales the button radius and padding', () => {
		const buttonJSON = JSON.stringify(
			renderButton( {
				href: 'https://example.com/setup',
				backgroundColor: '#462083',
				labelColor: '#ffffff',
				children: 'Set up email reports',
			} )
		);

		expect( buttonJSON ).toContain( `"borderRadius":${ 100 * PDF_SCALE }` );
		expect( buttonJSON ).toContain(
			`"paddingVertical":${ 6 * PDF_SCALE }`
		);
		expect( buttonJSON ).toContain(
			`"paddingHorizontal":${ 16 * PDF_SCALE }`
		);
	} );
} );

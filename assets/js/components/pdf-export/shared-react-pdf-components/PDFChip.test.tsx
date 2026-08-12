/**
 * PDFChip tests.
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
import { PDF_SCALE, scalePDFValue } from '@/js/components/pdf-export/pdf-scale';
import {
	PDF_COLORS,
	PDF_FONT_FAMILY_DISPLAY,
} from '@/js/components/pdf-export/pdf-theme';
import PDFChip from './PDFChip';

/**
 * Renders the chip and returns the test renderer's JSON tree.
 *
 * @since 1.183.0
 *
 * @param props Props for the chip.
 * @return The rendered tree.
 */
function renderChip(
	props: ComponentProps< typeof PDFChip >
): TestRenderer.ReactTestRendererJSON {
	const tree = TestRenderer.create( <PDFChip { ...props } /> ).toJSON();
	if ( ! tree || Array.isArray( tree ) ) {
		throw new Error( 'Unexpected render output.' );
	}
	return tree;
}

describe( 'PDFChip', () => {
	it( 'renders the label in the display font family at letter spacing 0.5, scaled to the page', () => {
		const chipJSON = JSON.stringify(
			renderChip( { label: 'Key metrics' } )
		);

		expect( chipJSON ).toContain( 'Key metrics' );
		expect( chipJSON ).toContain( PDF_FONT_FAMILY_DISPLAY );
		expect( chipJSON ).toContain(
			`"letterSpacing":${ scalePDFValue( 0.5 ) }`
		);
	} );

	it( 'renders a pill border in the border color, with no link, scaled to the page', () => {
		const tree = renderChip( { label: 'Key metrics' } );

		// The chip renders a plain `View`, not a `Link`.
		expect( tree.type ).toBe( 'pdf-view' );
		expect( tree.props.style ).toMatchObject( {
			borderWidth: 1 * PDF_SCALE,
			borderColor: PDF_COLORS.SURFACES_SURFACE_1,
			borderRadius: 100 * PDF_SCALE,
		} );
	} );

	it( 'renders the icon at size 20', () => {
		function Icon( { size, color }: { size?: number; color?: string } ) {
			return (
				<Svg width={ size } height={ size }>
					<Path d="M0 0" fill={ color } />
				</Svg>
			);
		}

		const chipJSON = JSON.stringify(
			renderChip( { label: 'Traffic', Icon } )
		);

		expect( chipJSON ).toContain( '"width":20' );
		expect( chipJSON ).toContain( '"height":20' );
	} );
} );

/**
 * PDFTypography tests.
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
import {
	PDF_COLORS,
	PDF_FONT_FAMILY_ARABIC,
	PDF_FONT_FAMILY_DISPLAY,
	PDF_FONT_FAMILY_TEXT,
} from '@/js/components/pdf-export/pdf-theme';
import PDFTypography from './PDFTypography';

/**
 * Merges a style array into one object, so assertions read one flat style.
 *
 * @since n.e.x.t
 *
 * @param style A style object, or the style array `@react-pdf` renders.
 * @return One object holding every style property.
 */
function flattenStyle(
	style: Record< string, unknown > | Array< Record< string, unknown > >
): Record< string, unknown > {
	return Array.isArray( style ) ? Object.assign( {}, ...style ) : style;
}

/**
 * Renders the text and returns its flattened style object.
 *
 * @since n.e.x.t
 *
 * @param props Props for the text.
 * @return One object holding every style property of the text.
 */
function renderTextStyle(
	props: ComponentProps< typeof PDFTypography >
): Record< string, unknown > {
	const renderer = TestRenderer.create( <PDFTypography { ...props } /> );
	const tree = renderer.toJSON();
	if ( ! tree || Array.isArray( tree ) ) {
		throw new Error( 'Unexpected render output.' );
	}
	return flattenStyle(
		tree.props.style as
			| Record< string, unknown >
			| Array< Record< string, unknown > >
	);
}

describe( 'PDFTypography', () => {
	it( 'renders a Text with the font family, size, weight, line height, and letter spacing of the given type and size', () => {
		const tree = TestRenderer.create(
			<PDFTypography type="headline" size="medium">
				Heading
			</PDFTypography>
		).toJSON();
		if ( ! tree || Array.isArray( tree ) ) {
			throw new Error( 'Unexpected render output.' );
		}

		expect( tree.type ).toBe( 'pdf-text' );
		expect( tree.children ).toEqual( [ 'Heading' ] );

		const style = flattenStyle(
			tree.props.style as
				| Record< string, unknown >
				| Array< Record< string, unknown > >
		);
		// The expected values for headline medium, scaled to the page.
		expect( style ).toMatchObject( {
			fontSize: 28 * PDF_SCALE,
			fontWeight: 400,
			letterSpacing: 0,
			lineHeight: 1.286,
			fontFamily: PDF_FONT_FAMILY_DISPLAY,
			color: PDF_COLORS.SURFACES_ON_SURFACE,
		} );
	} );

	it( 'uses the text font family for a body type', () => {
		const style = renderTextStyle( {
			type: 'body',
			size: 'small',
			children: 'Caption',
		} );

		expect( style ).toMatchObject( {
			fontSize: 12 * PDF_SCALE,
			fontWeight: 400,
			letterSpacing: 0.2 * PDF_SCALE,
			lineHeight: 1.33,
			fontFamily: PDF_FONT_FAMILY_TEXT,
		} );
	} );

	it( 'falls back to body medium with no type and size', () => {
		const style = renderTextStyle( { children: 'Default' } );

		expect( style ).toMatchObject( {
			fontSize: 14 * PDF_SCALE,
			fontWeight: 400,
			letterSpacing: 0.25 * PDF_SCALE,
			lineHeight: 1.43,
			fontFamily: PDF_FONT_FAMILY_TEXT,
			color: PDF_COLORS.SURFACES_ON_SURFACE,
		} );
	} );

	it( 'merges the style prop over the base styles', () => {
		const style = renderTextStyle( {
			type: 'body',
			size: 'medium',
			style: { color: '#108080', marginTop: 4 },
			children: 'Linked',
		} );

		// The font size comes from body medium, scaled. The `style` prop sets the
		// color and the top margin, and both stay unscaled because the caller
		// owns them.
		expect( style ).toMatchObject( {
			fontSize: 14 * PDF_SCALE,
			color: '#108080',
			marginTop: 4,
		} );
	} );

	describe( 'complex-script handling', () => {
		it( 'keeps the brand family for Cyrillic content, which the brand fonts cover', () => {
			const style = renderTextStyle( {
				type: 'headline',
				size: 'medium',
				children: 'Заголовок',
			} );

			expect( style.fontFamily ).toBe( PDF_FONT_FAMILY_DISPLAY );
		} );

		it( 'shapes Arabic content and draws it with the Arabic font alone', () => {
			const tree = TestRenderer.create(
				<PDFTypography type="body" size="medium">
					أداء موقعك
				</PDFTypography>
			).toJSON();
			if ( ! tree || Array.isArray( tree ) ) {
				throw new Error( 'Unexpected render output.' );
			}

			const style = flattenStyle(
				tree.props.style as
					| Record< string, unknown >
					| Array< Record< string, unknown > >
			);
			// The single Arabic font, not the `[brand, fallback]` stack, which
			// crashes @react-pdf's reordering.
			expect( style.fontFamily ).toBe( PDF_FONT_FAMILY_ARABIC );

			// The rendered text is shaped, not the raw logical-order input.
			const rendered = Array.isArray( tree.children )
				? tree.children.join( '' )
				: String( tree.children );
			expect( rendered ).not.toBe( 'أداء موقعك' );
		} );

		it( 'shapes Persian content and draws it with the Arabic font alone', () => {
			const tree = TestRenderer.create(
				<PDFTypography type="body" size="medium">
					عملکرد سایت شما
				</PDFTypography>
			).toJSON();
			if ( ! tree || Array.isArray( tree ) ) {
				throw new Error( 'Unexpected render output.' );
			}

			const style = flattenStyle(
				tree.props.style as
					| Record< string, unknown >
					| Array< Record< string, unknown > >
			);
			expect( style.fontFamily ).toBe( PDF_FONT_FAMILY_ARABIC );

			const rendered = Array.isArray( tree.children )
				? tree.children.join( '' )
				: String( tree.children );
			expect( rendered ).not.toBe( 'عملکرد سایت شما' );
		} );

		it( 'keeps the brand family for Latin content', () => {
			const style = renderTextStyle( {
				type: 'body',
				size: 'medium',
				children: 'Text',
			} );

			expect( style.fontFamily ).toBe( PDF_FONT_FAMILY_TEXT );
		} );
	} );
} );

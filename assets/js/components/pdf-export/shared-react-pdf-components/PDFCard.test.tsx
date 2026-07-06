/**
 * PDFCard tests.
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
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFCard from './PDFCard';

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
 * Renders the card and returns the test renderer's JSON tree.
 *
 * @since n.e.x.t
 *
 * @param props Props for the card.
 * @return The rendered tree.
 */
function renderCard(
	props: ComponentProps< typeof PDFCard >
): TestRenderer.ReactTestRendererJSON {
	const tree = TestRenderer.create( <PDFCard { ...props } /> ).toJSON();
	if ( ! tree || Array.isArray( tree ) ) {
		throw new Error( 'Unexpected render output.' );
	}
	return tree;
}

describe( 'PDFCard', () => {
	it( 'renders a white card with the radius and padding, scaled to the page', () => {
		const tree = renderCard( { children: 'card content' } );

		expect( tree.type ).toBe( 'pdf-view' );
		expect( tree.props.style ).toMatchObject( {
			backgroundColor: PDF_COLORS.SURFACES_SURFACE,
			borderRadius: 16 * PDF_SCALE,
			paddingVertical: 18 * PDF_SCALE,
			paddingHorizontal: 24 * PDF_SCALE,
		} );
	} );

	it( 'merges the style prop over the card styles', () => {
		const tree = renderCard( {
			style: { flexGrow: 1, padding: 0 },
			children: 'card content',
		} );

		const style = flattenStyle(
			tree.props.style as
				| Record< string, unknown >
				| Array< Record< string, unknown > >
		);

		// The card keeps its surface color and radius. The `style` prop adds
		// `flexGrow`, and its padding replaces the default. That padding stays
		// unscaled, because the caller sets it.
		expect( style ).toMatchObject( {
			backgroundColor: PDF_COLORS.SURFACES_SURFACE,
			borderRadius: 16 * PDF_SCALE,
			flexGrow: 1,
			padding: 0,
		} );
	} );
} );

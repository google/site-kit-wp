/**
 * PDFBadge tests.
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
import {
	PDF_SCALE,
	createPDFStyles,
} from '@/js/components/pdf-export/pdf-scale';
import PDFBadge from './PDFBadge';

/**
 * Renders the badge and returns the rendered tree as a JSON string.
 *
 * @since 1.186.0
 *
 * @param props Props for the badge.
 * @return JSON string of the rendered tree.
 */
function renderBadge( props: ComponentProps< typeof PDFBadge > ): string {
	return JSON.stringify(
		TestRenderer.create( <PDFBadge { ...props } /> ).toJSON()
	);
}

describe( 'PDFBadge', () => {
	it( 'renders the label in the colors it is given', () => {
		const badgeJSON = renderBadge( {
			label: 'Partial data',
			backgroundColor: '#ffe4b1',
			color: '#684500',
		} );

		expect( badgeJSON ).toContain( 'Partial data' );
		expect( badgeJSON ).toContain( '#ffe4b1' );
		expect( badgeJSON ).toContain( '#684500' );
	} );

	it( 'scales the base badge radius and padding', () => {
		const badgeJSON = renderBadge( {
			label: 'Partial data',
			backgroundColor: '#ffe4b1',
			color: '#684500',
		} );

		expect( badgeJSON ).toContain( `"borderRadius":${ 4 * PDF_SCALE }` );
		expect( badgeJSON ).toContain( `"paddingVertical":${ 4 * PDF_SCALE }` );
		expect( badgeJSON ).toContain(
			`"paddingHorizontal":${ 8 * PDF_SCALE }`
		);
	} );

	it( "merges a caller's style onto the base padding", () => {
		const { badge } = createPDFStyles( {
			badge: { paddingVertical: 6, paddingHorizontal: 10 },
		} );

		const badgeJSON = renderBadge( {
			label: 'Partial data',
			backgroundColor: '#ffe4b1',
			color: '#684500',
			style: badge,
		} );

		// The caller's padding wins over the base padding, while the base
		// radius is kept.
		expect( badgeJSON ).toContain( `"paddingVertical":${ 6 * PDF_SCALE }` );
		expect( badgeJSON ).toContain(
			`"paddingHorizontal":${ 10 * PDF_SCALE }`
		);
		expect( badgeJSON ).toContain( `"borderRadius":${ 4 * PDF_SCALE }` );
	} );
} );

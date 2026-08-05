/**
 * PDFTruncatedValue tests.
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
 * Internal dependencies
 */
import { PDF_SCALE } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import { renderJSON } from '@/js/components/pdf-export/test-utils';
import PDFTruncatedValue from './PDFTruncatedValue';

describe( 'PDFTruncatedValue', () => {
	it( 'keeps a 20px gap between the value and the metric and sizes the value to the width that remains', () => {
		const json = renderJSON(
			<PDFTruncatedValue>A very long page title</PDFTruncatedValue>
		);

		expect( json ).toContain(
			`"flexGrow":1,"flexShrink":1,"flexBasis":0,"marginRight":${
				20 * PDF_SCALE
			}`
		);
	} );

	it( 'truncates the value to one line with an ellipsis', () => {
		const json = renderJSON(
			<PDFTruncatedValue>A very long page title</PDFTruncatedValue>
		);

		expect( json ).toContain( '"textOverflow":"ellipsis"' );
		expect( json ).toContain( '"maxLines":1' );
	} );

	it( 'links the value to the href and renders it in the link color', () => {
		const json = renderJSON(
			<PDFTruncatedValue href="https://example.com/report/home">
				Home
			</PDFTruncatedValue>
		);

		expect( json ).toContain( '"src":"https://example.com/report/home"' );
		expect( json ).toContain( PDF_COLORS.CONTENT_SECONDARY );
		// A linked value truncates the same way a value with no link does.
		expect( json ).toContain( '"textOverflow":"ellipsis"' );
		expect( json ).toContain( '"maxLines":1' );
	} );

	it( 'renders the value as plain text in the default color when the href is an empty string', () => {
		const json = renderJSON(
			<PDFTruncatedValue href="">Home</PDFTruncatedValue>
		);

		expect( json ).not.toContain( 'pdf-link' );
		expect( json ).toContain( 'Home' );
		expect( json ).not.toContain( PDF_COLORS.CONTENT_SECONDARY );
	} );

	it( 'renders the value in the body small typography', () => {
		const json = renderJSON(
			<PDFTruncatedValue type="body" size="small">
				A page title
			</PDFTruncatedValue>
		);

		// The dashboard sets body small to 12px and its letter spacing to 0.2px.
		// PDF_SCALE scales both to the PDF page width.
		expect( json ).toContain( `"fontSize":${ 12 * PDF_SCALE }` );
		expect( json ).toContain( `"letterSpacing":${ 0.2 * PDF_SCALE }` );
	} );

	it( 'renders the value in the given color and ends it with an ellipsis', () => {
		const json = renderJSON(
			<PDFTruncatedValue
				style={ { color: PDF_COLORS.CONTENT_SECONDARY } }
			>
				A page title
			</PDFTruncatedValue>
		);

		expect( json ).toContain( PDF_COLORS.CONTENT_SECONDARY );
		expect( json ).toContain( '"textOverflow":"ellipsis"' );
	} );
} );

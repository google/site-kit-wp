/**
 * PDFSvg tests.
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
import { Path } from '@react-pdf/renderer';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { scalePDFValue } from '@/js/components/pdf-export/pdf-scale';
import { render } from '@tests/js/test-utils';
import PDFSvg from './PDFSvg';

describe( 'PDFSvg', () => {
	it( 'scales the width and height to the page and passes the viewBox', () => {
		const svgJSON = JSON.stringify(
			TestRenderer.create(
				<PDFSvg width={ 24 } height={ 2 } viewBox="0 0 16 2">
					<Path d="M0 0" fill="#000000" />
				</PDFSvg>
			).toJSON()
		);

		expect( svgJSON ).toContain( `"width":${ scalePDFValue( 24 ) }` );
		expect( svgJSON ).toContain( `"height":${ scalePDFValue( 2 ) }` );
		expect( svgJSON ).toContain( '"viewBox":"0 0 16 2"' );
	} );

	it( 'renders its children inside the SVG', () => {
		const { container } = render(
			<PDFSvg width={ 24 } height={ 24 } viewBox="0 0 24 24">
				<Path d="M0 0" fill="#111111" />
			</PDFSvg>
		);

		expect(
			container.querySelector( 'pdf-svg pdf-path' )
		).toBeInTheDocument();
	} );
} );

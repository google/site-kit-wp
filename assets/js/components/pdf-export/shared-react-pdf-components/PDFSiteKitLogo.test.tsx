/**
 * PDFSiteKitLogo tests.
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
import { PDFLogoG } from '@/js/components/pdf-export/pdf-icons';
import { scalePDFValue } from '@/js/components/pdf-export/pdf-scale';
import { renderJSON } from '@/js/components/pdf-export/test-utils';
import { render } from '@tests/js/test-utils';
import PDFSiteKitLogo from './PDFSiteKitLogo';

describe( 'PDFSiteKitLogo', () => {
	it( 'renders the "Site Kit" wordmark', () => {
		const { getByText } = render( <PDFSiteKitLogo /> );

		expect( getByText( 'Site Kit' ) ).toBeInTheDocument();
	} );

	it( 'renders the Google "G" at its size and color', () => {
		// `?pdf` imports resolve to a shared mock, so this assertion covers
		// the icon's size and color.
		expect( renderJSON( <PDFSiteKitLogo /> ) ).toContain(
			renderJSON( <PDFLogoG size={ 24 } /> )
		);
	} );

	it( 'scales the gap between the wordmark and the icon', () => {
		expect( renderJSON( <PDFSiteKitLogo /> ) ).toContain(
			`"marginLeft":${ scalePDFValue( 7 ) }`
		);
	} );
} );

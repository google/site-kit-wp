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
import { render } from '@tests/js/test-utils';
import PDFSiteKitLogo from './PDFSiteKitLogo';

describe( 'PDFSiteKitLogo', () => {
	it( 'renders the colour Google "G" and the "Site Kit" wordmark', () => {
		const { container, getByText } = render( <PDFSiteKitLogo /> );

		// The "G" is four coloured paths.
		const svgs = Array.from( container.querySelectorAll( 'pdf-svg' ) );
		expect(
			svgs.find(
				( svg ) => svg.querySelectorAll( 'pdf-path' ).length === 4
			)
		).toBeTruthy();
		// The wordmark is rendered as text rather than SVG paths.
		expect( getByText( 'Site Kit' ) ).toBeInTheDocument();
	} );

	it( 'renders the "G" with the brand colours', () => {
		const { container } = render( <PDFSiteKitLogo /> );

		const gPaths = Array.from(
			container.querySelectorAll( 'pdf-svg' )
		).find( ( svg ) => svg.querySelectorAll( 'pdf-path' ).length === 4 );

		const fills = Array.from(
			gPaths?.querySelectorAll( 'pdf-path' ) ?? []
		).map( ( path ) => path.getAttribute( 'fill' ) );

		expect( fills ).toEqual( [
			'#FBBC05',
			'#EA4335',
			'#34A853',
			'#4285F4',
		] );
	} );
} );

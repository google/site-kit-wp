/**
 * PDFEmailReportingNotice tests.
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
import PDFEmailReportingNotice from './PDFEmailReportingNotice';

describe( 'PDFEmailReportingNotice', () => {
	it( 'renders the title, the body text, and the "Set up email reports" button', () => {
		const { getByText } = render(
			<PDFEmailReportingNotice emailReportingSetupURL="https://example.com/golink" />
		);

		expect(
			getByText(
				'Get your site’s most important insights delivered to your inbox'
			)
		).toBeInTheDocument();
		expect(
			getByText(
				'Stay updated with a summary of your site’s performance, key trends, and tailored metrics sent directly to your inbox.'
			)
		).toBeInTheDocument();
		expect(
			getByText(
				'This feature is available exclusively to Site Kit users.'
			)
		).toBeInTheDocument();
		expect( getByText( 'Set up email reports' ) ).toBeInTheDocument();
	} );

	it( 'renders the star icon as a single SVG path with a dark purple fill', () => {
		const { container } = render(
			<PDFEmailReportingNotice emailReportingSetupURL="https://example.com/golink" />
		);

		const starPaths = container.querySelectorAll( 'pdf-path' );
		expect( starPaths ).toHaveLength( 1 );
		expect( starPaths[ 0 ] ).toHaveAttribute(
			'd',
			'M5.825 22L8.15 14.4L2 10H9.6L12 2L14.4 10H22L15.85 14.4L18.175 22L12 17.3L5.825 22Z'
		);
		expect( starPaths[ 0 ] ).toHaveAttribute( 'fill', '#462083' );
	} );

	it( 'links the "Set up email reports" button to the given email reporting setup URL', () => {
		const { container } = render(
			<PDFEmailReportingNotice emailReportingSetupURL="https://example.com/golink" />
		);

		expect( container.querySelector( 'pdf-link' ) ).toHaveAttribute(
			'src',
			'https://example.com/golink'
		);
	} );

	it( 'renders the light purple background, the dark purple title and body text, and the dark purple button with white text', () => {
		const { container, getByText } = render(
			<PDFEmailReportingNotice emailReportingSetupURL="https://example.com/golink" />
		);

		// The notice background is light purple.
		expect( container.querySelector( 'pdf-view' ) ).toHaveStyle( {
			backgroundColor: '#e3d1ff',
		} );
		// The title text is dark purple.
		expect(
			getByText(
				'Get your site’s most important insights delivered to your inbox'
			)
		).toHaveStyle( { color: '#462083' } );
		// The body text is dark purple.
		expect(
			getByText(
				'Stay updated with a summary of your site’s performance, key trends, and tailored metrics sent directly to your inbox.'
			)
		).toHaveStyle( { color: '#462083' } );
		expect(
			getByText(
				'This feature is available exclusively to Site Kit users.'
			)
		).toHaveStyle( { color: '#462083' } );
		// The button background is dark purple.
		expect(
			getByText( 'Set up email reports' ).closest( 'pdf-view' )
		).toHaveStyle( { backgroundColor: '#462083' } );
		// The button text is white.
		expect( getByText( 'Set up email reports' ) ).toHaveStyle( {
			color: '#ffffff',
		} );
	} );

	it( 'renders the "Set up email reports" button even when no email reporting setup URL is given', () => {
		const { container, getByText } = render( <PDFEmailReportingNotice /> );

		const setupLink = container.querySelector( 'pdf-link' );
		expect( setupLink ).toBeInTheDocument();
		expect( setupLink ).not.toHaveAttribute( 'src' );
		expect( getByText( 'Set up email reports' ) ).toBeInTheDocument();
	} );
} );

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
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { PDFStarFill } from '@/js/components/pdf-export/pdf-icons';
import { scalePDFValue } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import { renderJSON } from '@/js/components/pdf-export/test-utils';
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

	it( 'renders the star icon at its size and color', () => {
		// `?pdf` imports resolve to a shared mock, so this assertion covers
		// the icon's size and color.
		expect(
			renderJSON(
				<PDFEmailReportingNotice emailReportingSetupURL="https://example.com/golink" />
			)
		).toContain( renderJSON( <PDFStarFill size={ 24 } /> ) );
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

	it( 'renders the notice background, text, and button in the theme colors', () => {
		// The notice background is a single style object on the container, so
		// the rendered element shows it.
		const { container } = render(
			<PDFEmailReportingNotice emailReportingSetupURL="https://example.com/golink" />
		);
		expect( container.querySelector( 'pdf-view' ) ).toHaveStyle( {
			backgroundColor: PDF_COLORS.VIOLET_V_50,
		} );

		// The title, body, and button text hold arrays of styles, which never
		// reach the rendered elements' CSS, so the color assertions read the
		// test renderer's JSON tree instead.
		const noticeJSON = JSON.stringify(
			TestRenderer.create(
				<PDFEmailReportingNotice emailReportingSetupURL="https://example.com/golink" />
			).toJSON()
		);
		expect( noticeJSON ).toContain( PDF_COLORS.VIOLET_V_600 );
		expect( noticeJSON ).toContain( PDF_COLORS.SURFACES_SURFACE );
	} );

	it( 'sets its own gap above the notice', () => {
		// The notice sits outside the body container, so it owns the gap above
		// it, the same way the footer owns its top gap.
		const { container } = render(
			<PDFEmailReportingNotice emailReportingSetupURL="https://example.com/golink" />
		);

		expect( container.querySelector( 'pdf-view' ) ).toHaveStyle( {
			marginTop: scalePDFValue( 59 ),
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

/**
 * PDFPieChartTile tests.
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
import { PDF_SCALE } from '@/js/components/pdf-export/pdf-scale';
import { render } from '@tests/js/test-utils';
import PDFPieChartTile from './PDFPieChartTile';

const CHART_DATA_URI = 'data:image/jpeg;base64,TU9DS1BJRQ==';

const ROWS = [
	{ label: 'Organic Search', percentage: '79.2%', color: '#fece72' },
	{ label: 'Direct', percentage: '13.3%', color: '#a983e6' },
	{ label: 'Social', percentage: '5.6%', color: '#bed4ff' },
];

describe( 'PDFPieChartTile', () => {
	it( 'renders the title, the legend rows in order, and the donut image', () => {
		const { container, getByText } = render(
			<PDFPieChartTile
				title="Visitors by channels"
				rows={ ROWS }
				chartImage={ CHART_DATA_URI }
			/>
		);

		expect( getByText( 'Visitors by channels' ) ).toBeInTheDocument();

		// The legend keeps the supplied order.
		const renderedText = Array.from(
			container.querySelectorAll( 'pdf-text' )
		).map( ( node ) => node.textContent );
		expect( renderedText.indexOf( 'Organic Search' ) ).toBeLessThan(
			renderedText.indexOf( 'Direct' )
		);
		expect( renderedText.indexOf( 'Direct' ) ).toBeLessThan(
			renderedText.indexOf( 'Social' )
		);

		// Each row pairs its label with its percentage.
		expect( getByText( '79.2%' ) ).toBeInTheDocument();
		expect( getByText( '13.3%' ) ).toBeInTheDocument();
		expect( getByText( '5.6%' ) ).toBeInTheDocument();

		// The donut is embedded as an image with the supplied data URI.
		expect( container.querySelector( 'pdf-image' ) ).toHaveAttribute(
			'src',
			CHART_DATA_URI
		);
	} );

	it( 'gives each legend swatch the background color of its row', () => {
		const { getByText } = render(
			<PDFPieChartTile
				title="Visitors by channels"
				rows={ ROWS }
				chartImage={ CHART_DATA_URI }
			/>
		);

		// The swatch is the first view inside each legend row.
		const organicSwatch = getByText( 'Organic Search' )
			.closest( 'pdf-view' )
			?.querySelector( 'pdf-view' );
		const directSwatch = getByText( 'Direct' )
			.closest( 'pdf-view' )
			?.querySelector( 'pdf-view' );
		const socialSwatch = getByText( 'Social' )
			.closest( 'pdf-view' )
			?.querySelector( 'pdf-view' );

		expect( organicSwatch ).toHaveStyle( { backgroundColor: '#fece72' } );
		expect( directSwatch ).toHaveStyle( { backgroundColor: '#a983e6' } );
		expect( socialSwatch ).toHaveStyle( { backgroundColor: '#bed4ff' } );
	} );

	it( 'right-aligns each percentage', () => {
		const { getByText } = render(
			<PDFPieChartTile
				title="Visitors by channels"
				rows={ ROWS }
				chartImage={ CHART_DATA_URI }
			/>
		);

		expect( getByText( '79.2%' ) ).toHaveStyle( { textAlign: 'right' } );
	} );

	it( 'renders the Data unavailable placeholder when chartImage is null', () => {
		const { container, getByText, queryByText } = render(
			<PDFPieChartTile
				title="Visitors by channels"
				rows={ ROWS }
				chartImage={ undefined }
			/>
		);

		expect( getByText( 'Visitors by channels' ) ).toBeInTheDocument();
		expect( getByText( 'Data unavailable' ) ).toBeInTheDocument();
		// The legend and donut are dropped while the placeholder shows.
		expect( queryByText( 'Organic Search' ) ).not.toBeInTheDocument();
		expect(
			container.querySelector( 'pdf-image' )
		).not.toBeInTheDocument();
	} );

	it( 'scales the title font size and the donut image', () => {
		const json = JSON.stringify(
			TestRenderer.create(
				<PDFPieChartTile
					title="Visitors by channels"
					rows={ ROWS }
					chartImage={ CHART_DATA_URI }
				/>
			).toJSON()
		);

		// The tile title font size scales.
		expect( json ).toContain( `"fontSize":${ 14 * PDF_SCALE }` );
		// The donut image scales.
		expect( json ).toContain( `"width":${ 145.7 * PDF_SCALE }` );
	} );
} );

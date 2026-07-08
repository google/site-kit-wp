/**
 * PDFMetricChartTile tests.
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
import { PDF_SCALE, scalePDFValue } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFMetricChartTile from './PDFMetricChartTile';

const CHART_DATA_URI = 'data:image/jpeg;base64,TU9DS0NIQVJU';

/**
 * Arrow paths the tile must not render, because the change badge draws
 * no direction arrow.
 */
const UP_ARROW_PATH = 'M4,0 L8,8 L0,8 Z';
const DOWN_ARROW_PATH = 'M0,0 L8,0 L4,8 Z';

/**
 * Renders the tile and returns the rendered tree as a JSON string.
 *
 * @since n.e.x.t
 *
 * @param props Props for the tile.
 * @return JSON string of the rendered tree.
 */
function renderTile( props: ComponentProps< typeof PDFMetricChartTile > ) {
	const renderer = TestRenderer.create( <PDFMetricChartTile { ...props } /> );
	return JSON.stringify( renderer.toJSON() );
}

describe( 'PDFMetricChartTile', () => {
	it( 'should render the title, value, change label and chart image', () => {
		const json = renderTile( {
			title: 'Total Impressions',
			value: '9.2K',
			changeLabel: 'Vs. prev. 28 days',
			currentLabel: 'Impressions',
			color: '#6380b8',
			chartImage: CHART_DATA_URI,
		} );

		expect( json ).toContain( 'Total Impressions' );
		expect( json ).toContain( '9.2K' );
		expect( json ).toContain( 'Vs. prev. 28 days' );
		expect( json ).toContain( CHART_DATA_URI );
		expect( json ).not.toContain( 'Data unavailable' );
	} );

	it( 'should render the current and previous period legend swatches in the series color', () => {
		const json = renderTile( {
			title: 'Total Impressions',
			value: '9.2K',
			currentLabel: 'Impressions',
			previousLabel: 'Previous period',
			color: '#6380b8',
			chartImage: CHART_DATA_URI,
		} );

		expect( json ).toContain( 'Impressions' );
		expect( json ).toContain( 'Previous period' );
		// The legend swatches are drawn in the metric's series color, with the
		// previous-period swatch dashed to mirror the chart's dotted line.
		expect( json ).toContain( '#6380b8' );
		expect( json ).toContain( '3 2' );
	} );

	it( 'uses the positive colors and no arrow for a rising change', () => {
		const json = renderTile( {
			title: 'Total Clicks',
			value: '3.6K',
			change: '12.5%',
			changeDirection: 'up',
			currentLabel: 'Clicks',
			color: '#4bbbbb',
			chartImage: CHART_DATA_URI,
		} );

		expect( json ).toContain( '12.5%' );
		expect( json ).toContain( PDF_COLORS.GREEN_G_50 );
		expect( json ).toContain( PDF_COLORS.UTILITY_ON_SUCCESS_CONTAINER );
		expect( json ).not.toContain( UP_ARROW_PATH );
	} );

	it( 'uses the negative colors and no arrow for a falling change', () => {
		const json = renderTile( {
			title: 'Total Impressions',
			value: '9.2K',
			change: '5.2%',
			changeDirection: 'down',
			currentLabel: 'Impressions',
			color: '#6380b8',
			chartImage: CHART_DATA_URI,
		} );

		expect( json ).toContain( '5.2%' );
		expect( json ).toContain( PDF_COLORS.UTILITY_ERROR_CONTAINER );
		expect( json ).toContain( PDF_COLORS.UTILITY_ON_ERROR_CONTAINER );
		expect( json ).not.toContain( DOWN_ARROW_PATH );
	} );

	it( 'hides the change badge when the metric has no change', () => {
		const json = renderTile( {
			title: 'Total Impressions',
			value: '9.2K',
			currentLabel: 'Impressions',
			color: '#6380b8',
			chartImage: CHART_DATA_URI,
		} );

		expect( json ).not.toContain( PDF_COLORS.GREEN_G_50 );
		expect( json ).not.toContain( PDF_COLORS.UTILITY_ERROR_CONTAINER );
	} );

	it( 'returns null when the chart image is null', () => {
		// The tile returns null, and no placeholder takes its place.
		const renderer = TestRenderer.create(
			<PDFMetricChartTile
				title="Total Impressions"
				value="9.2K"
				change="5.2%"
				changeDirection="down"
				currentLabel="Impressions"
				color="#6380b8"
				chartImage={ null }
			/>
		);

		expect( renderer.toJSON() ).toBeNull();
	} );

	it( 'scales the tile font sizes and the arrow width', () => {
		const json = renderTile( {
			title: 'Total Clicks',
			value: '3.6K',
			change: '12.5%',
			changeDirection: 'up',
			currentLabel: 'Clicks',
			color: '#4bbbbb',
			chartImage: CHART_DATA_URI,
		} );

		// The font sizes of the title and value scale with the page.
		expect( json ).toContain( `"fontSize":${ 14 * PDF_SCALE }` );
		expect( json ).toContain( `"fontSize":${ 28 * PDF_SCALE }` );
		// The change arrow width scales with the page.
		expect( json ).toContain( `"width":${ scalePDFValue( 24 ) }` );
	} );
} );

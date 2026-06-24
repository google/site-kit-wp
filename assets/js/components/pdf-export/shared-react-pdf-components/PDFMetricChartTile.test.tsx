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
import type { ComponentProps } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import PDFMetricChartTile from './PDFMetricChartTile';

const CHART_DATA_URI = 'data:image/jpeg;base64,TU9DS0NIQVJU';

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

	it( 'should render the up arrow and success color for a positive change', () => {
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
		expect( json ).toContain( 'M4,0 L8,8 L0,8 Z' );
		expect( json ).toContain( '#34a853' );
	} );

	it( 'should render the down arrow and error color for a negative change', () => {
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
		expect( json ).toContain( 'M0,0 L8,0 L4,8 Z' );
		expect( json ).toContain( '#ea4335' );
	} );

	it( 'should omit the change chip when no change is provided', () => {
		const json = renderTile( {
			title: 'Total Impressions',
			value: '9.2K',
			currentLabel: 'Impressions',
			color: '#6380b8',
			chartImage: CHART_DATA_URI,
		} );

		expect( json ).not.toContain( '#34a853' );
		expect( json ).not.toContain( '#ea4335' );
	} );

	it( 'should render the Data unavailable placeholder when the chart image is null', () => {
		const json = renderTile( {
			title: 'Total Impressions',
			value: '9.2K',
			change: '5.2%',
			changeDirection: 'down',
			currentLabel: 'Impressions',
			color: '#6380b8',
			chartImage: null,
		} );

		expect( json ).toContain( 'Data unavailable' );
		// The metric value and chart are suppressed in the placeholder state.
		expect( json ).not.toContain( '9.2K' );
		expect( json ).not.toContain( 'data:image' );
	} );
} );

/**
 * DashboardAllTrafficWidgetGA4 indexPDF tests.
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
import { PDF_SCALE } from '@/js/components/pdf-export/pdf-scale';
import DashboardAllTrafficWidgetGA4PDF from './indexPDF';

const LINE_CHART_DATA_URI = 'data:image/jpeg;base64,TU9DS0NIQVJU';
const CHANNEL_CHART_DATA_URI = 'data:image/jpeg;base64,Q0hBTk5FTA==';
const LOCATION_CHART_DATA_URI = 'data:image/jpeg;base64,TE9DQVRJT05T';
const DEVICE_CHART_DATA_URI = 'data:image/jpeg;base64,REVWSUNFUw==';

function buildReports( {
	currentUsers,
	previousUsers,
	rowCount,
}: {
	currentUsers: string;
	previousUsers: string;
	rowCount: number;
} ) {
	return {
		totalsReport: {
			totals: [
				{ metricValues: [ { value: currentUsers } ] },
				{ metricValues: [ { value: previousUsers } ] },
			],
		},
		graphReport: {
			rows: Array.from( { length: rowCount }, () => ( {
				metricValues: [ { value: '1' } ],
			} ) ),
		},
	};
}

function renderTree(
	props: ComponentProps< typeof DashboardAllTrafficWidgetGA4PDF >
) {
	const renderer = TestRenderer.create(
		<DashboardAllTrafficWidgetGA4PDF { ...props } />
	);
	return renderer.toJSON();
}

describe( 'DashboardAllTrafficWidgetGA4 PDF', () => {
	it( 'should render the widget heading, All visitors metric tile, and the line chart image when chart images are supplied', () => {
		const data = buildReports( {
			currentUsers: '1234',
			previousUsers: '1000',
			rowCount: 28,
		} );

		const tree = renderTree( {
			data,
			chartImages: { lineChart: LINE_CHART_DATA_URI },
		} );
		const json = JSON.stringify( tree );

		expect( json ).toContain( 'Your site traffic over time' );
		expect( json ).toContain( 'All visitors' );
		// `numFmt` shortens large totals, the same as the dashboard widget.
		expect( json ).toContain( '1.2K' );
		expect( json ).toContain( 'Vs. prev. 28 days' );
		// The rendered chart is embedded as an image with the supplied data URI.
		expect( json ).toContain( LINE_CHART_DATA_URI );
		expect( json ).not.toContain( 'No data available' );
	} );

	it( 'should render the No data available chart fallback when chart images are missing', () => {
		const data = buildReports( {
			currentUsers: '1234',
			previousUsers: '1000',
			rowCount: 28,
		} );

		const tree = renderTree( { data } );
		const json = JSON.stringify( tree );

		// The metric tile still renders. Only the chart area falls back.
		expect( json ).toContain( 'All visitors' );
		expect( json ).toContain( 'No data available' );
		expect( json ).not.toContain( 'data:image' );
	} );

	it( 'should render a green chip with a positive signed change', () => {
		const data = buildReports( {
			currentUsers: '1200',
			previousUsers: '1000',
			rowCount: 28,
		} );

		const tree = renderTree( {
			data,
			chartImages: { lineChart: LINE_CHART_DATA_URI },
		} );
		const json = JSON.stringify( tree );

		expect( json ).toContain( '#d8ffc0' );
		expect( json ).toContain( '+20%' );
	} );

	it( 'should render a red chip with a negative signed change', () => {
		const data = buildReports( {
			currentUsers: '800',
			previousUsers: '1000',
			rowCount: 28,
		} );

		const tree = renderTree( {
			data,
			chartImages: { lineChart: LINE_CHART_DATA_URI },
		} );
		const json = JSON.stringify( tree );

		expect( json ).toContain( '#ffded3' );
		expect( json ).toContain( '-20%' );
	} );

	it( 'should render the No data available placeholder when data is null', () => {
		const tree = renderTree( { data: null } );
		const json = JSON.stringify( tree );

		expect( json ).toContain( 'No data available' );
		expect( json ).not.toContain( 'All visitors' );
	} );

	it( 'should render the No data available placeholder when data is undefined', () => {
		const tree = renderTree( {} );
		const json = JSON.stringify( tree );

		expect( json ).toContain( 'No data available' );
	} );

	it( 'should render the three breakdown pie tiles with legend rows and donut images', () => {
		const data = {
			...buildReports( {
				currentUsers: '1234',
				previousUsers: '1000',
				rowCount: 28,
			} ),
			channelBreakdown: [
				{ label: 'Organic Search', percentage: 0.792 },
				{ label: 'Direct', percentage: 0.133 },
			],
			locationBreakdown: [
				{ label: 'Singapore', percentage: 0.228 },
				{ label: 'Others', percentage: 0.156 },
			],
			deviceBreakdown: [
				{ label: 'Desktop', percentage: 0.584 },
				{ label: 'Mobile', percentage: 0.413 },
			],
		};

		const tree = renderTree( {
			data,
			chartImages: {
				lineChart: LINE_CHART_DATA_URI,
				channelChart: CHANNEL_CHART_DATA_URI,
				locationChart: LOCATION_CHART_DATA_URI,
				deviceChart: DEVICE_CHART_DATA_URI,
			},
		} );
		const json = JSON.stringify( tree );

		// Each breakdown renders its titled tile.
		expect( json ).toContain( 'Visitors by channels' );
		expect( json ).toContain( 'Visitors by locations' );
		expect( json ).toContain( 'Visitors by devices' );

		// The legend pairs each label with its formatted percentage.
		expect( json ).toContain( 'Organic Search' );
		expect( json ).toContain( '79.2%' );
		expect( json ).toContain( 'Singapore' );
		expect( json ).toContain( '22.8%' );
		expect( json ).toContain( 'Desktop' );
		expect( json ).toContain( '58.4%' );

		// The first two swatches use the shared colors, in order.
		expect( json ).toContain( '"backgroundColor":"#fece72"' );
		expect( json ).toContain( '"backgroundColor":"#a983e6"' );

		// Each tile embeds its donut image.
		expect( json ).toContain( CHANNEL_CHART_DATA_URI );
		expect( json ).toContain( LOCATION_CHART_DATA_URI );
		expect( json ).toContain( DEVICE_CHART_DATA_URI );
	} );

	it( 'should render a Data unavailable placeholder for a breakdown whose chart image is missing', () => {
		const data = {
			...buildReports( {
				currentUsers: '1234',
				previousUsers: '1000',
				rowCount: 28,
			} ),
			channelBreakdown: null,
			locationBreakdown: [ { label: 'Singapore', percentage: 0.5 } ],
			deviceBreakdown: [ { label: 'Desktop', percentage: 0.5 } ],
		};

		const tree = renderTree( {
			data,
			chartImages: {
				lineChart: LINE_CHART_DATA_URI,
				locationChart: LOCATION_CHART_DATA_URI,
				deviceChart: DEVICE_CHART_DATA_URI,
			},
		} );
		const json = JSON.stringify( tree );

		// The channels tile has no donut, so it shows the placeholder.
		expect( json ).toContain( 'Visitors by channels' );
		expect( json ).toContain( 'Data unavailable' );
		expect( json ).not.toContain( CHANNEL_CHART_DATA_URI );

		// The other two tiles still render their donuts.
		expect( json ).toContain( LOCATION_CHART_DATA_URI );
		expect( json ).toContain( DEVICE_CHART_DATA_URI );
	} );

	it( 'scales the widget heading font size', () => {
		const data = buildReports( {
			currentUsers: '1234',
			previousUsers: '1000',
			rowCount: 28,
		} );

		const json = JSON.stringify(
			renderTree( {
				data,
				chartImages: { lineChart: LINE_CHART_DATA_URI },
			} )
		);

		expect( json ).toContain( `"fontSize":${ 16 * PDF_SCALE }` );
	} );
} );

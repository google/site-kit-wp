/**
 * SearchFunnelWidgetGA4 indexPDF tests.
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
import { PDF_SCALE } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import SearchFunnelWidgetGA4PDF from './indexPDF';

const CHART_DATA_URI = 'data:image/jpeg;base64,TU9DS0NIQVJU';

/**
 * Builds the widget data fixture with a total and change for each metric.
 *
 * @since n.e.x.t
 *
 * @return The widget data fixture.
 */
function buildData() {
	return {
		dateRangeLength: 28,
		metrics: {
			impressions: { total: 9200, change: -0.052 },
			clicks: { total: 3600, change: 0.1 },
			uniqueVisitors: { total: 3000, change: 0.2 },
			keyEvents: { total: 670, change: -0.05 },
		},
	};
}

/**
 * Builds the chart image fixture with the same data URI for each metric.
 *
 * @since n.e.x.t
 *
 * @return Map of metric key to chart image data URI.
 */
function buildChartImages() {
	return {
		impressions: CHART_DATA_URI,
		clicks: CHART_DATA_URI,
		uniqueVisitors: CHART_DATA_URI,
		keyEvents: CHART_DATA_URI,
	};
}

/**
 * Renders the widget to a JSON string for content and style assertions.
 *
 * @since n.e.x.t
 *
 * @param props Props passed to the widget.
 * @return JSON string of the rendered tree.
 */
function renderTree(
	props: ComponentProps< typeof SearchFunnelWidgetGA4PDF >
) {
	const renderer = TestRenderer.create(
		<SearchFunnelWidgetGA4PDF { ...props } />
	);
	return JSON.stringify( renderer.toJSON() );
}

describe( 'SearchFunnelWidgetGA4 PDF', () => {
	it( 'should render its own sub-section heading and the four metric cards', () => {
		const json = renderTree( {
			data: buildData(),
			chartImages: buildChartImages(),
		} );

		expect( json ).toContain( 'Search traffic over time' );

		// The four card titles render in sentence case.
		expect( json ).toContain( 'Total impressions' );
		expect( json ).toContain( 'Total clicks' );
		expect( json ).toContain( 'Unique visitors from Search' );
		expect( json ).toContain( 'Key events' );

		// Formatted headline values.
		expect( json ).toContain( '9.2K' );
		expect( json ).toContain( '3.6K' );
		expect( json ).toContain( '670' );

		// The shared comparison sub-text reflects the selected date range.
		expect( json ).toContain( 'Vs. prev. 28 days' );

		// Each card embeds its rendered chart image.
		const chartImageCount = json.split( CHART_DATA_URI ).length - 1;
		expect( chartImageCount ).toBe( 4 );

		expect( json ).not.toContain( 'Data unavailable' );
	} );

	it( 'should show rising changes in the positive colors and falling changes in the negative colors', () => {
		const json = renderTree( {
			data: buildData(),
			chartImages: buildChartImages(),
		} );

		// Total Clicks at +10% and Unique Visitors at +20% are positive.
		expect( json ).toContain( PDF_COLORS.GREEN_G_50 );
		expect( json ).toContain( PDF_COLORS.UTILITY_ON_SUCCESS_CONTAINER );
		expect( json ).toContain( '10%' );
		// Total Impressions at -5.2% and Key Events at -5% are negative.
		expect( json ).toContain( PDF_COLORS.UTILITY_ERROR_CONTAINER );
		expect( json ).toContain( PDF_COLORS.UTILITY_ON_ERROR_CONTAINER );
		expect( json ).toContain( '5.2%' );
	} );

	it( 'should render nothing for a card whose chart image is null', () => {
		const json = renderTree( {
			data: buildData(),
			chartImages: {
				...buildChartImages(),
				uniqueVisitors: null,
			},
		} );

		// The widget skips the card without a chart, and no placeholder
		// takes its place.
		expect( json ).not.toContain( 'Unique visitors from Search' );
		expect( json ).not.toContain( 'Data unavailable' );

		// The other three cards still render their titles and charts.
		expect( json ).toContain( 'Total impressions' );
		expect( json ).toContain( 'Total clicks' );
		expect( json ).toContain( 'Key events' );
		const chartImageCount = json.split( CHART_DATA_URI ).length - 1;
		expect( chartImageCount ).toBe( 3 );
	} );

	it( 'should render nothing when the widget has no data', () => {
		const renderer = TestRenderer.create(
			<SearchFunnelWidgetGA4PDF data={ null } />
		);

		expect( renderer.toJSON() ).toBeNull();
	} );

	it( 'scales the sub-section heading font size', () => {
		const json = renderTree( {
			data: buildData(),
			chartImages: buildChartImages(),
		} );

		expect( json ).toContain( `"fontSize":${ 16 * PDF_SCALE }` );
	} );
} );

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
import type { ComponentProps } from 'react';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import SearchFunnelWidgetGA4PDF from './indexPDF';

const CHART_DATA_URI = 'data:image/jpeg;base64,TU9DS0NIQVJU';

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

function buildChartImages() {
	return {
		impressions: CHART_DATA_URI,
		clicks: CHART_DATA_URI,
		uniqueVisitors: CHART_DATA_URI,
		keyEvents: CHART_DATA_URI,
	};
}

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

		// All four card titles.
		expect( json ).toContain( 'Total Impressions' );
		expect( json ).toContain( 'Total Clicks' );
		expect( json ).toContain( 'Unique Visitors from Search' );
		expect( json ).toContain( 'Key Events' );

		// Formatted headline values.
		expect( json ).toContain( '9.2K' );
		expect( json ).toContain( '3.6K' );
		expect( json ).toContain( '670' );

		// The shared comparison sub-text reflects the selected date range.
		expect( json ).toContain( 'Vs. prev. 28 days' );

		// Each card embeds its rasterised chart image.
		const chartImageCount = json.split( CHART_DATA_URI ).length - 1;
		expect( chartImageCount ).toBe( 4 );

		expect( json ).not.toContain( 'Data unavailable' );
	} );

	it( 'should color the change chips green for positive and red for negative changes', () => {
		const json = renderTree( {
			data: buildData(),
			chartImages: buildChartImages(),
		} );

		// Total Clicks (+10%) and Unique Visitors (+20%) are positive (green).
		expect( json ).toContain( '#34a853' );
		expect( json ).toContain( '10%' );
		// Total Impressions (-5.2%) is negative (red).
		expect( json ).toContain( '#ea4335' );
		expect( json ).toContain( '5.2%' );
	} );

	it( 'should render a per-card Data unavailable placeholder when a single chart image is null', () => {
		const json = renderTree( {
			data: buildData(),
			chartImages: {
				...buildChartImages(),
				uniqueVisitors: null,
			},
		} );

		expect( json ).toContain( 'Data unavailable' );
		// The other three cards still render their titles and charts.
		expect( json ).toContain( 'Total Impressions' );
		expect( json ).toContain( 'Total Clicks' );
		expect( json ).toContain( 'Key Events' );
	} );

	it( 'should render the whole-widget fallback when data is null', () => {
		const json = renderTree( { data: null } );

		expect( json ).toContain( 'Search traffic over time' );
		expect( json ).toContain( 'Data unavailable' );
		expect( json ).not.toContain( 'Total Impressions' );
	} );
} );

/**
 * ModuleOverviewWidgetPDF component tests.
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
import ModuleOverviewWidgetPDF from './ModuleOverviewWidgetPDF';

const CHART_DATA_URI = 'data:image/jpeg;base64,TU9DS0NIQVJU';

/**
 * Builds the widget data fixture with a total and change for each metric.
 *
 * @since 1.184.0
 *
 * @return The widget data fixture.
 */
function buildData() {
	return {
		dateRangeLength: 28,
		currencyCode: 'USD',
		metrics: {
			estimatedEarnings: { total: 1234.56, change: 0.1 },
			pageRPM: { total: 12.34, change: -0.052 },
			impressions: { total: 9876, change: 0.2 },
			pageCTR: { total: 0.171, change: -0.05 },
		},
	};
}

/**
 * Builds the chart image fixture with the same data URI for each metric.
 *
 * @since 1.184.0
 *
 * @return Map of metric key to chart image data URI.
 */
function buildChartImages() {
	return {
		estimatedEarnings: CHART_DATA_URI,
		pageRPM: CHART_DATA_URI,
		impressions: CHART_DATA_URI,
		pageCTR: CHART_DATA_URI,
	};
}

/**
 * Renders the widget to a JSON string so tests can assert on content and style.
 *
 * @since 1.184.0
 *
 * @param props Props passed to the widget.
 * @return JSON string of the rendered tree.
 */
function renderTree( props: ComponentProps< typeof ModuleOverviewWidgetPDF > ) {
	const renderer = TestRenderer.create(
		<ModuleOverviewWidgetPDF { ...props } />
	);
	return JSON.stringify( renderer.toJSON() );
}

describe( 'ModuleOverviewWidgetPDF', () => {
	it( 'should render the "Earning performance over time" heading and the four metric cards', () => {
		const json = renderTree( {
			data: buildData(),
			chartImages: buildChartImages(),
		} );

		expect( json ).toContain( 'Earning performance over time' );

		// The four card titles match the dashboard card labels.
		expect( json ).toContain( 'Earnings' );
		expect( json ).toContain( 'Page RPM' );
		expect( json ).toContain( 'Impressions' );
		expect( json ).toContain( 'Page CTR' );

		// The shared comparison sub-text shows the selected date range.
		expect( json ).toContain( 'Vs. prev. 28 days' );

		// Each card embeds its rendered chart image.
		const chartImageCount = json.split( CHART_DATA_URI ).length - 1;
		expect( chartImageCount ).toBe( 4 );

		expect( json ).not.toContain( 'Data unavailable' );
	} );

	it( 'should format Earnings and Page RPM as currency, Impressions with thousands separators, and Page CTR as a percentage', () => {
		const json = renderTree( {
			data: buildData(),
			chartImages: buildChartImages(),
		} );

		expect( json ).toContain( '$1,234.56' );
		expect( json ).toContain( '$12.34' );
		expect( json ).toContain( '9,876' );
		expect( json ).toContain( '17.1%' );
	} );

	it( 'should fall back to a plain grouped number when the report has no currency code', () => {
		const data = buildData();
		delete ( data as { currencyCode?: string } ).currencyCode;

		const json = renderTree( {
			data,
			chartImages: buildChartImages(),
		} );

		expect( json ).toContain( '1,234.56' );
		expect( json ).not.toContain( '$1,234.56' );
	} );

	it( 'should show rising changes in the positive colors and falling changes in the negative colors', () => {
		const json = renderTree( {
			data: buildData(),
			chartImages: buildChartImages(),
		} );

		// Earnings at +10% and Impressions at +20% are positive.
		expect( json ).toContain( PDF_COLORS.GREEN_G_50 );
		expect( json ).toContain( PDF_COLORS.UTILITY_ON_SUCCESS_CONTAINER );
		expect( json ).toContain( '10%' );
		// Page RPM at -5.2% and Page CTR at -5% are negative.
		expect( json ).toContain( PDF_COLORS.UTILITY_ERROR_CONTAINER );
		expect( json ).toContain( PDF_COLORS.UTILITY_ON_ERROR_CONTAINER );
		expect( json ).toContain( '5.2%' );
	} );

	it( 'should render nothing for a card whose chart image is null, keeping the grid cells at half width', () => {
		const json = renderTree( {
			data: buildData(),
			chartImages: {
				...buildChartImages(),
				pageRPM: null,
			},
		} );

		// The widget skips the card without a chart, and no placeholder
		// takes its place.
		expect( json ).not.toContain( 'Page RPM' );
		expect( json ).not.toContain( 'Data unavailable' );

		// The other three cards still render their titles and charts, each in
		// its own half-width cell.
		expect( json ).toContain( 'Earnings' );
		expect( json ).toContain( 'Impressions' );
		expect( json ).toContain( 'Page CTR' );
		const chartImageCount = json.split( CHART_DATA_URI ).length - 1;
		expect( chartImageCount ).toBe( 3 );
		const cellCount = json.split( '"width":"48.94%"' ).length - 1;
		expect( cellCount ).toBe( 3 );
	} );

	it( 'should render nothing when the widget has no data', () => {
		const renderer = TestRenderer.create(
			<ModuleOverviewWidgetPDF data={ null } />
		);

		expect( renderer.toJSON() ).toBeNull();
	} );

	it( 'should scale the sub-section heading font size', () => {
		const json = renderTree( {
			data: buildData(),
			chartImages: buildChartImages(),
		} );

		expect( json ).toContain( `"fontSize":${ 16 * PDF_SCALE }` );
	} );
} );

/**
 * Traffic Overview indexPDF tests.
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
import TrafficOverviewPDF from './indexPDF';

const LINE_CHART_DATA_URI = 'data:image/jpeg;base64,TU9DS0NIQVJU';

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
			{ label: 'Mobile', percentage: 0.416 },
		],
	};
}

function renderTree( props: ComponentProps< typeof TrafficOverviewPDF > ) {
	const renderer = TestRenderer.create( <TrafficOverviewPDF { ...props } /> );
	return renderer.toJSON();
}

/** The reports most tests render against; only the sign-change test varies `previousUsers`. */
const DEFAULT_REPORTS = buildReports( {
	currentUsers: '1234',
	previousUsers: '1000',
	rowCount: 28,
} );

describe( 'Traffic Overview PDF', () => {
	it( 'should render nothing when data is null', () => {
		expect( renderTree( { data: null } ) ).toBeNull();
	} );

	it( 'should render nothing when data is undefined', () => {
		expect( renderTree( {} ) ).toBeNull();
	} );

	it( 'should render the heading and the All visitors tile with its value, change, and line chart', () => {
		const json = JSON.stringify(
			renderTree( {
				data: DEFAULT_REPORTS,
				chartImages: { lineChart: LINE_CHART_DATA_URI },
			} )
		);

		expect( json ).toContain( 'Your site traffic over time' );
		expect( json ).toContain( 'All visitors' );
		// `numFmt` shortens large totals, the same as the dashboard widget.
		expect( json ).toContain( '1.2K' );
		expect( json ).toContain( '+23.4%' );
		expect( json ).toContain( 'Vs. prev. 28 days' );
		expect( json ).toContain( LINE_CHART_DATA_URI );
	} );

	it( 'should render the All visitors tile without a chart when the chart image is missing', () => {
		const json = JSON.stringify( renderTree( { data: DEFAULT_REPORTS } ) );

		expect( json ).toContain( 'All visitors' );
		expect( json ).not.toContain( 'data:image' );
	} );

	it( 'should print no change badge when the previous value is 0', () => {
		const data = buildReports( {
			currentUsers: '1234',
			previousUsers: '0',
			rowCount: 28,
		} );

		const json = JSON.stringify(
			renderTree( {
				data,
				chartImages: { lineChart: LINE_CHART_DATA_URI },
			} )
		);

		// Neither the positive nor the negative badge fill renders.
		expect( json ).not.toContain( '#d8ffc0' );
		expect( json ).not.toContain( '#ffded3' );
	} );

	it( 'should render the three ranked tiles, in order, with their headings and rows', () => {
		const json = JSON.stringify(
			renderTree( {
				data: DEFAULT_REPORTS,
				chartImages: { lineChart: LINE_CHART_DATA_URI },
			} )
		);

		const channelsIndex = json.indexOf( 'Visitors by channels' );
		const locationsIndex = json.indexOf( 'Visitors by locations' );
		const devicesIndex = json.indexOf( 'Visitors by devices' );

		expect( channelsIndex ).toBeGreaterThan( -1 );
		expect( locationsIndex ).toBeGreaterThan( channelsIndex );
		expect( devicesIndex ).toBeGreaterThan( locationsIndex );

		// Each row's label pairs with its share, formatted as a whole percent.
		expect( json ).toContain( 'Organic Search' );
		expect( json ).toContain( '79%' );
		expect( json ).toContain( 'Singapore' );
		expect( json ).toContain( '23%' );
		expect( json ).toContain( 'Desktop' );
		expect( json ).toContain( '58%' );
		expect( json ).toContain( 'Others' );
	} );

	it( 'should render no change badge on the ranked tiles', () => {
		const json = JSON.stringify(
			renderTree( {
				data: DEFAULT_REPORTS,
				chartImages: { lineChart: LINE_CHART_DATA_URI },
			} )
		);

		// The All visitors change is the only badge fill in the tree.
		const badgeCount = json.split( '#d8ffc0' ).length - 1;
		expect( badgeCount ).toBe( 1 );
	} );

	it( 'should print a breakdown’s heading and its empty state when it has no rows, while the other two still print their rows', () => {
		const data = { ...DEFAULT_REPORTS, channelBreakdown: [] };

		const json = JSON.stringify(
			renderTree( {
				data,
				chartImages: { lineChart: LINE_CHART_DATA_URI },
			} )
		);

		expect( json ).toContain( 'Visitors by channels' );
		expect( json ).toContain(
			'No data to display: your site hasn’t received any visitors yet'
		);
		expect( json ).not.toContain( 'Organic Search' );

		expect( json ).toContain( 'Visitors by locations' );
		expect( json ).toContain( 'Singapore' );
		expect( json ).toContain( 'Visitors by devices' );
		expect( json ).toContain( 'Desktop' );
	} );

	it( 'should print a breakdown’s empty state when its rows are null', () => {
		const data = { ...DEFAULT_REPORTS, locationBreakdown: null };

		const json = JSON.stringify(
			renderTree( {
				data,
				chartImages: { lineChart: LINE_CHART_DATA_URI },
			} )
		);

		expect( json ).toContain( 'Visitors by locations' );
		expect( json ).toContain(
			'No data to display: your site hasn’t received any visitors yet'
		);
		expect( json ).not.toContain( 'Singapore' );
	} );

	it( 'should render no donut chart image and no colour-swatched legend', () => {
		const json = JSON.stringify(
			renderTree( {
				data: DEFAULT_REPORTS,
				chartImages: { lineChart: LINE_CHART_DATA_URI },
			} )
		);

		// The line chart is the only rendered image data URI.
		expect( json.split( LINE_CHART_DATA_URI ).length - 1 ).toBe( 1 );
		// None of the donut legend's swatch colors render.
		[ '#fece72', '#a983e6', '#bed4ff', '#ee92da', '#ff9b7a' ].forEach(
			( swatch ) => {
				expect( json ).not.toContain( swatch );
			}
		);
	} );
} );

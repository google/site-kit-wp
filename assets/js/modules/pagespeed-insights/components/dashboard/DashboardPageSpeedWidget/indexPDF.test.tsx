/**
 * DashboardPageSpeedWidgetPDF unit tests.
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
import { omit } from 'lodash';
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { PDF_SCALE } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { findTextStrings } from '@/js/components/pdf-export/test-utils';
import {
	ScoredMetric,
	extractFieldMetrics,
	extractLabMetrics,
} from '@/js/modules/pagespeed-insights/components/common/reportMetrics';
import * as fixtures from '@/js/modules/pagespeed-insights/datastore/__fixtures__';
import { SpeedPDFData, StrategyData } from './getPDFData';
import DashboardPageSpeedWidgetPDF from './indexPDF';
import MetricRow from './MetricRow';
import MetricSection from './MetricSection';
import MetricValueCell from './MetricValueCell';

/**
 * Extracts the lab and field metrics from a fixture report, shaped as one
 * strategy's entry in the widget data.
 *
 * @since 1.183.0
 *
 * @param report A PageSpeed Insights report fixture.
 * @return The lab and field metrics for one strategy.
 */
function buildStrategyData( report: object ): StrategyData {
	return {
		lab: extractLabMetrics( report ),
		field: extractFieldMetrics( report ),
	};
}

/**
 * Builds widget data from the fixture reports. A null report sets that
 * strategy's entry to null, like a failed report in production.
 *
 * @since 1.183.0
 *
 * @param params               Report overrides per strategy.
 * @param params.mobileReport  The mobile report, or null to omit mobile data.
 * @param params.desktopReport The desktop report, or null to omit desktop data.
 * @return The widget data for both strategies.
 */
function buildData( {
	mobileReport = fixtures.pagespeedMobile as object | null,
	desktopReport = fixtures.pagespeedDesktop as object | null,
}: {
	mobileReport?: object | null;
	desktopReport?: object | null;
} = {} ): SpeedPDFData[ 'data' ] {
	return {
		mobile: mobileReport ? buildStrategyData( mobileReport ) : null,
		desktop: desktopReport ? buildStrategyData( desktopReport ) : null,
	};
}

/**
 * Renders the widget with the given data and collects its visible text.
 *
 * @since 1.183.0
 *
 * @param data The widget data to render.
 * @return The rendered text as one space-joined string.
 */
function renderText( data: SpeedPDFData[ 'data' ] | null ): string {
	const renderer = TestRenderer.create(
		<DashboardPageSpeedWidgetPDF data={ data } />
	);
	const json = renderer.toJSON();
	const root = Array.isArray( json ) ? json[ 0 ] : json;
	return findTextStrings( root ).join( ' ' );
}

/**
 * Renders the widget with the given data and returns the whole test tree as
 * a JSON string, so a test can search it for style values like colors.
 *
 * @since 1.183.0
 *
 * @param data The widget data to render.
 * @return The rendered tree as a JSON string.
 */
function renderJSON( data: SpeedPDFData[ 'data' ] | null ): string {
	return JSON.stringify(
		TestRenderer.create(
			<DashboardPageSpeedWidgetPDF data={ data } />
		).toJSON()
	);
}

/**
 * Removes field metrics from a fixture report, like a report whose CrUX data
 * lacks them.
 *
 * @since n.e.x.t
 *
 * @param report  A PageSpeed Insights report fixture.
 * @param metrics The `loadingExperience.metrics` keys to remove.
 * @return The report without those metrics.
 */
function omitFieldMetrics( report: object, metrics: string[] ): object {
	return omit(
		report,
		metrics.map( ( metric ) => `loadingExperience.metrics.${ metric }` )
	);
}

/**
 * Renders the widget and finds one of its metric sections.
 *
 * @since n.e.x.t
 *
 * @param data  The widget data to render.
 * @param title The section's title, like "Real user data".
 * @return The section, or undefined when the widget leaves it out.
 */
function findSection(
	data: SpeedPDFData[ 'data' ],
	title: string
): TestRenderer.ReactTestInstance | undefined {
	return TestRenderer.create(
		<DashboardPageSpeedWidgetPDF data={ data } />
	).root.findAll(
		( node ) => node.type === MetricSection && node.props.title === title
	)[ 0 ];
}

/**
 * Collects the text a value cell renders.
 *
 * @since n.e.x.t
 *
 * @param cell A rendered value cell.
 * @return The cell's text, empty when the cell renders no value.
 */
function getCellText( cell: TestRenderer.ReactTestInstance ): unknown[] {
	return cell
		.findAllByType( PDFTypography )
		.map( ( typography ) => typography.props.children );
}

/**
 * Flattens the style of a row's outer view into one object.
 *
 * @since n.e.x.t
 *
 * @param row A rendered metric row.
 * @return The row's flattened style.
 */
function getRowStyle(
	row: TestRenderer.ReactTestInstance
): Record< string, unknown > {
	const [ view ] = row.children as TestRenderer.ReactTestInstance[];

	return Object.assign( {}, ...[ view.props.style ].flat() );
}

describe( 'DashboardPageSpeedWidgetPDF', () => {
	it( 'renders Mobile and Desktop as column headers in each section card', () => {
		const text = renderText( buildData() );

		expect( text ).toContain( 'Mobile' );
		expect( text ).toContain( 'Desktop' );
	} );

	it( 'renders lab section card with Lab data heading and three metric rows', () => {
		const text = renderText( buildData() );

		expect( text ).toContain( 'Lab data' );
		// Each metric title appears once per row (row spans both strategies).
		expect( text ).toContain( 'Largest Contentful Paint' );
		expect( text ).toContain( 'Cumulative Layout Shift' );
		expect( text ).toContain( 'Total Blocking Time' );
	} );

	it( 'renders Real user data section when field metrics are available', () => {
		const text = renderText( buildData() );

		expect( text ).toContain( 'Real user data' );
		expect( text ).toContain( 'Interaction to Next Paint' );
	} );

	it( 'omits Real user data section when extractFieldMetrics returns null', () => {
		const noFieldData: SpeedPDFData[ 'data' ] = {
			mobile: {
				lab: extractLabMetrics( fixtures.pagespeedMobileNoFieldData ),
				field: null,
			},
			desktop: {
				lab: extractLabMetrics( fixtures.pagespeedDesktopNoFieldData ),
				field: null,
			},
		};

		const text = renderText( noFieldData );

		expect( text ).not.toContain( 'Real user data' );
		expect( text ).not.toContain( 'Interaction to Next Paint' );
	} );

	it( 'omits Real user data section when neither report holds any of the three field metrics', () => {
		const threeMetrics = [
			'LARGEST_CONTENTFUL_PAINT_MS',
			'CUMULATIVE_LAYOUT_SHIFT_SCORE',
			'INTERACTION_TO_NEXT_PAINT',
		];
		const data = buildData( {
			mobileReport: omitFieldMetrics(
				fixtures.pagespeedMobile,
				threeMetrics
			),
			desktopReport: omitFieldMetrics(
				fixtures.pagespeedDesktop,
				threeMetrics
			),
		} );
		const noFieldMetrics = {
			largestContentfulPaint: null,
			cumulativeLayoutShift: null,
			interactionToNextPaint: null,
		};

		// The reports keep their other CrUX metrics, like First Contentful
		// Paint, so each strategy still holds a field object.
		expect( data?.mobile?.field ).toEqual( noFieldMetrics );
		expect( data?.desktop?.field ).toEqual( noFieldMetrics );
		expect( findSection( data, 'Real user data' ) ).toBeUndefined();
		expect( renderText( data ) ).not.toContain( 'Real user data' );
	} );

	it( 'drops the Real user data rows whose metric holds no value for either strategy', () => {
		const section = findSection(
			buildData( {
				mobileReport: fixtures.pagespeedMobilePartialFieldData,
				desktopReport: fixtures.pagespeedDesktopPartialFieldData,
			} ),
			'Real user data'
		);

		expect(
			section
				?.findAllByType( MetricRow )
				.map( ( row ) => row.props.title )
		).toEqual( [ 'Interaction to Next Paint' ] );
	} );

	it( 'keeps the three Lab data rows when Real user data rows are dropped', () => {
		const labSection = findSection(
			buildData( {
				mobileReport: fixtures.pagespeedMobilePartialFieldData,
				desktopReport: fixtures.pagespeedDesktopPartialFieldData,
			} ),
			'Lab data'
		);

		expect(
			labSection
				?.findAllByType( MetricRow )
				.map( ( row ) => row.props.title )
		).toEqual( [
			'Largest Contentful Paint',
			'Cumulative Layout Shift',
			'Total Blocking Time',
		] );
	} );

	it( 'keeps the Mobile and Desktop headings in the Real user data section after rows are dropped', () => {
		const section = findSection(
			buildData( {
				mobileReport: fixtures.pagespeedMobilePartialFieldData,
				desktopReport: fixtures.pagespeedDesktopPartialFieldData,
			} ),
			'Real user data'
		);

		expect(
			section
				?.findAllByType( PDFTypography )
				.map( ( typography ) => typography.props.children )
		).toEqual(
			expect.arrayContaining( [ 'Real user data', 'Mobile', 'Desktop' ] )
		);
	} );

	it( 'keeps only the Largest Contentful Paint row when it is the only field metric Mobile holds and Desktop holds none', () => {
		const data = buildData( {
			mobileReport: omitFieldMetrics( fixtures.pagespeedMobile, [
				'CUMULATIVE_LAYOUT_SHIFT_SCORE',
				'INTERACTION_TO_NEXT_PAINT',
			] ),
			desktopReport: fixtures.pagespeedDesktopNoFieldData,
		} );
		const section = findSection( data, 'Real user data' );
		const rows = section?.findAllByType( MetricRow ) ?? [];

		expect( rows.map( ( row ) => row.props.title ) ).toEqual( [
			'Largest Contentful Paint',
		] );

		const [ mobileCell, desktopCell ] =
			rows[ 0 ].findAllByType( MetricValueCell );

		expect( getCellText( mobileCell ) ).toContain(
			data?.mobile?.field?.largestContentfulPaint?.displayValue
		);
		expect( getCellText( desktopCell ) ).toEqual( [] );
	} );

	it( 'keeps a Real user data row that only Desktop holds a value for, with the Mobile cell empty', () => {
		const data = buildData( {
			mobileReport: fixtures.pagespeedMobilePartialFieldData,
		} );
		const section = findSection( data, 'Real user data' );
		const rows = section?.findAllByType( MetricRow ) ?? [];

		// Desktop holds all three metrics, so all three rows stay.
		expect( rows.map( ( row ) => row.props.title ) ).toEqual( [
			'Largest Contentful Paint',
			'Cumulative Layout Shift',
			'Interaction to Next Paint',
		] );

		const [ mobileCell, desktopCell ] =
			rows[ 0 ].findAllByType( MetricValueCell );

		expect( getCellText( mobileCell ) ).toEqual( [] );
		expect( getCellText( desktopCell ) ).toContain(
			data?.desktop?.field?.largestContentfulPaint?.displayValue
		);
	} );

	it( 'renders the last remaining Real user data row without a bottom divider', () => {
		const section = findSection(
			buildData( {
				mobileReport: omitFieldMetrics( fixtures.pagespeedMobile, [
					'INTERACTION_TO_NEXT_PAINT',
				] ),
				desktopReport: omitFieldMetrics( fixtures.pagespeedDesktop, [
					'INTERACTION_TO_NEXT_PAINT',
				] ),
			} ),
			'Real user data'
		);
		const rows = section?.findAllByType( MetricRow ) ?? [];

		expect( rows.map( ( row ) => row.props.title ) ).toEqual( [
			'Largest Contentful Paint',
			'Cumulative Layout Shift',
		] );
		expect( getRowStyle( rows[ 0 ] ).borderBottomWidth ).not.toBe( 0 );
		expect( getRowStyle( rows[ 1 ] ).borderBottomWidth ).toBe( 0 );
	} );

	it( 'renders an empty value cell for a null strategy while the other strategy still renders', () => {
		const text = renderText( buildData( { mobileReport: null } ) );

		// Desktop lab metrics still render.
		expect( text ).toContain( 'Total Blocking Time' );
		// The null strategy adds no text and no placeholder.
		expect( text ).not.toContain( '—' );
		expect( text ).not.toContain( 'Data unavailable.' );
	} );

	it( 'returns null when both strategies are null', () => {
		// The whole widget returns null, heading included.
		const renderer = TestRenderer.create(
			<DashboardPageSpeedWidgetPDF
				data={ { mobile: null, desktop: null } }
			/>
		);

		expect( renderer.toJSON() ).toBeNull();
	} );

	it( 'returns null when data is null', () => {
		const renderer = TestRenderer.create(
			<DashboardPageSpeedWidgetPDF data={ null } />
		);

		expect( renderer.toJSON() ).toBeNull();
	} );

	it( 'renders each score pill with the theme colors of its category', () => {
		function buildMetric( category: string ): ScoredMetric {
			return { displayValue: '2.5 s', score: 0.5, category };
		}

		const data: SpeedPDFData[ 'data' ] = {
			mobile: {
				lab: {
					largestContentfulPaint: buildMetric( 'fast' ),
					cumulativeLayoutShift: buildMetric( 'average' ),
					totalBlockingTime: buildMetric( 'slow' ),
				},
				field: null,
			},
			desktop: null,
		};

		const speedWidgetJSON = renderJSON( data );

		// Good: the change-badge green pair.
		expect( speedWidgetJSON ).toContain( PDF_COLORS.GREEN_G_50 );
		expect( speedWidgetJSON ).toContain(
			PDF_COLORS.UTILITY_ON_SUCCESS_CONTAINER
		);
		// Needs improvement: the yellow pair.
		expect( speedWidgetJSON ).toContain( PDF_COLORS.YELLOW_Y_50 );
		expect( speedWidgetJSON ).toContain( PDF_COLORS.YELLOW_Y_500 );
		// Poor: the change-badge red pair.
		expect( speedWidgetJSON ).toContain(
			PDF_COLORS.UTILITY_ERROR_CONTAINER
		);
		expect( speedWidgetJSON ).toContain(
			PDF_COLORS.UTILITY_ON_ERROR_CONTAINER
		);

		const text = renderText( data );
		expect( text ).toContain( 'Good' );
		expect( text ).toContain( 'Needs improvement' );
		expect( text ).toContain( 'Poor' );
	} );

	it( 'renders the section cards on the shared card surface', () => {
		const speedWidgetJSON = renderJSON( buildData() );

		// Two white cards render: the lab card and the real user data card.
		const cardCount =
			speedWidgetJSON.split(
				`"backgroundColor":"${ PDF_COLORS.SURFACES_SURFACE }"`
			).length - 1;
		expect( cardCount ).toBe( 2 );
	} );

	it( 'keeps the strategy header labels over their value columns', () => {
		const speedWidgetJSON = renderJSON( buildData() );

		// The header row and every metric row carry the same scaled column
		// gap, so the "Mobile" and "Desktop" labels start where their
		// columns' values start. Two cards render: each holds one header row
		// and three metric rows.
		const columnGapCount =
			speedWidgetJSON.split( `"columnGap":${ 24 * PDF_SCALE }` ).length -
			1;
		expect( columnGapCount ).toBe( 8 );
	} );

	it( 'scales the score pill padding', () => {
		const speedWidgetJSON = renderJSON( buildData() );

		expect( speedWidgetJSON ).toContain(
			`"paddingVertical":${ 3 * PDF_SCALE }`
		);
		expect( speedWidgetJSON ).toContain(
			`"paddingHorizontal":${ 10 * PDF_SCALE }`
		);
	} );
} );

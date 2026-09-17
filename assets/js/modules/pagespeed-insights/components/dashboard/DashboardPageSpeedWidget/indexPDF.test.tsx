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
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { PDF_SCALE } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
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

	it( 'renders only Real user data rows available for either strategy', () => {
		const data = buildData( {
			mobileReport: fixtures.pagespeedMobilePartialFieldData,
			desktopReport: fixtures.pagespeedDesktopPartialFieldData,
		} );
		const renderer = TestRenderer.create(
			<DashboardPageSpeedWidgetPDF data={ data } />
		);
		const rows = renderer.root.findAllByType( MetricRow );

		// LCP and CLS remain in Lab data, but their empty Real user data rows
		// are omitted. INP is the only surviving Real user data row.
		expect(
			rows.filter(
				( row ) => row.props.title === 'Largest Contentful Paint'
			)
		).toHaveLength( 1 );
		expect(
			rows.filter(
				( row ) => row.props.title === 'Cumulative Layout Shift'
			)
		).toHaveLength( 1 );
		const inpRows = rows.filter(
			( row ) => row.props.title === 'Interaction to Next Paint'
		);
		expect( inpRows ).toHaveLength( 1 );
		expect( inpRows[ 0 ].props.isLast ).toBe( true );

		const text = renderText( data );
		expect( text.match( /Mobile/g ) ).toHaveLength( 2 );
		expect( text.match( /Desktop/g ) ).toHaveLength( 2 );
	} );

	it( 'keeps a Real user data row when only one strategy has its metric', () => {
		const data = buildData( {
			mobileReport: fixtures.pagespeedMobilePartialFieldData,
		} );
		const renderer = TestRenderer.create(
			<DashboardPageSpeedWidgetPDF data={ data } />
		);
		const lcpRows = renderer.root
			.findAllByType( MetricRow )
			.filter(
				( row ) => row.props.title === 'Largest Contentful Paint'
			);

		expect( lcpRows ).toHaveLength( 2 );
		expect( lcpRows[ 1 ].props.mobileMetric ).toBeNull();
		expect( lcpRows[ 1 ].props.desktopMetric ).not.toBeNull();
	} );

	it( 'omits Real user data when every field metric is null', () => {
		const emptyField = {
			largestContentfulPaint: null,
			cumulativeLayoutShift: null,
			interactionToNextPaint: null,
		};
		const data: SpeedPDFData[ 'data' ] = {
			mobile: {
				lab: extractLabMetrics( fixtures.pagespeedMobile ),
				field: emptyField,
			},
			desktop: {
				lab: extractLabMetrics( fixtures.pagespeedDesktop ),
				field: emptyField,
			},
		};

		const text = renderText( data );

		expect( text ).not.toContain( 'Real user data' );
		expect( text ).not.toContain( 'Interaction to Next Paint' );
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

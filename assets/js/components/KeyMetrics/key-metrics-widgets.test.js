/**
 * Key Metrics widgets metadata tests.
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
 * Internal dependencies
 */
import {
	CORE_USER,
	KM_ANALYTICS_FORM_COMPLETION_ENGAGEMENT_RATE,
	KM_ANALYTICS_FORM_COMPLETION_RATE,
	KM_ANALYTICS_LEADS_BY_COUNTRIES,
	KM_ANALYTICS_LEADS_BY_DEVICE_TYPE,
	KM_ANALYTICS_LEADS_BY_VISITOR_TYPE,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_RETURNING_VISITORS,
	KM_ANALYTICS_SALES_BY_COUNTRIES,
	KM_ANALYTICS_SALES_BY_VISITOR_TYPE,
	KM_ANALYTICS_SALES_ENGAGEMENT_RATE,
	KM_ANALYTICS_SALES_RATE,
	KM_ANALYTICS_TOP_AUTHORS_DRIVING_LEADS,
	KM_ANALYTICS_TOP_AUTHORS_DRIVING_SALES,
	KM_ANALYTICS_TOP_CITIES,
	KM_ANALYTICS_TOP_PAGES_DRIVING_SALES,
	KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_FORM_COMPLETION_RATE,
	KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_SALES_RATE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOTAL_FORM_COMPLETIONS,
	KM_ANALYTICS_TOTAL_SALES,
} from '@/js/googlesitekit/datastore/user/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { numFmt } from '@/js/util';
import { KEY_METRICS_PDF_TILES } from './key-metrics-pdf-tiles';
import { KEY_METRICS_WIDGETS } from './key-metrics-widgets';

/**
 * Builds a fake `select` for exercising a Key Metric tile's display gates
 * without a full registry, mirroring the real selectors' "some events
 * detected" / "every dimension available" combining logic.
 *
 * @since n.e.x.t
 *
 * @param {Object}   options                             Options.
 * @param {string[]} [options.detectedEvents]            The Analytics 4 detected conversion events.
 * @param {boolean}  [options.isKeyMetricActive]         Whether the tile is already an active Key Metric.
 * @param {string[]} [options.availableCustomDimensions] The Analytics 4 available custom dimensions.
 * @return {Function} A fake `select( store )` function.
 */
function makeSelect( {
	detectedEvents = [],
	isKeyMetricActive = false,
	availableCustomDimensions = [],
} = {} ) {
	return ( store ) => {
		if ( store === MODULES_ANALYTICS_4 ) {
			return {
				hasConversionReportingEvents: ( events ) =>
					( Array.isArray( events ) ? events : [ events ] ).some(
						( event ) => detectedEvents.includes( event )
					),
				hasCustomDimensions: ( dimensions ) =>
					( Array.isArray( dimensions )
						? dimensions
						: [ dimensions ]
					).every( ( dimension ) =>
						availableCustomDimensions.includes( dimension )
					),
			};
		}

		if ( store === CORE_USER ) {
			return { isKeyMetricActive: () => isKeyMetricActive };
		}

		throw new Error( `Unexpected store selected in test: ${ store }` );
	};
}

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

/**
 * The percent format the Top Cities tile uses for each city's share.
 */
const PERCENT_1DP = { style: 'percent', maximumFractionDigits: 1 };

/**
 * Builds a registry whose `fetchGetReport` resolves with the given report, so a
 * tile's `getTileData` can be exercised against a report fixture.
 *
 * @since 1.184.0
 *
 * @param {Object} report The report response to resolve.
 * @return {Object} A mock registry.
 */
function registryReturning( report ) {
	const fetchGetReport = jest.fn( () =>
		Promise.resolve( { response: report } )
	);
	return { dispatch: jest.fn( () => ( { fetchGetReport } ) ) };
}

/**
 * Builds a registry whose `fetchGetReport` resolves with the given reports in
 * order, so a tile that requests more than one report gets each in turn.
 *
 * @since 1.186.0
 *
 * @param {Object[]} reports The report responses to resolve, in fetch order.
 * @return {Object} A mock registry.
 */
function registryReturningReports( reports ) {
	let call = 0;
	const fetchGetReport = jest.fn( () =>
		Promise.resolve( { response: reports[ call++ ] } )
	);
	return { dispatch: jest.fn( () => ( { fetchGetReport } ) ) };
}

/**
 * Loads one tile's data against a single report fixture.
 *
 * @since 1.186.0
 *
 * @param {string} slug   The key metric slug.
 * @param {Object} report The report response the tile fetches.
 * @return {Promise<Object|null>} The resolved tile data.
 */
function loadTile( slug, report ) {
	return KEY_METRICS_PDF_TILES[ slug ].getTileData( {
		registry: registryReturning( report ),
		dates: DATES,
		signal: new AbortController().signal,
	} );
}

/**
 * Loads one tile's data against several report fixtures, in fetch order.
 *
 * @since 1.186.0
 *
 * @param {string}   slug    The key metric slug.
 * @param {Object[]} reports The report responses the tile fetches, in order.
 * @return {Promise<Object|null>} The resolved tile data.
 */
function loadTileWithReports( slug, reports ) {
	return KEY_METRICS_PDF_TILES[ slug ].getTileData( {
		registry: registryReturningReports( reports ),
		dates: DATES,
		signal: new AbortController().signal,
	} );
}

/**
 * Builds a registry for the tiles that read a report before deciding what to
 * fetch: `resolveSelect().getReport` returns `resolvedReport` for that first
 * read, and `fetchGetReport` returns `fetchReports` in order for the rest.
 *
 * @since 1.186.0
 *
 * @param {Object}   resolvedReport The report the tile reads up front.
 * @param {Object[]} fetchReports   The report responses the tile then fetches.
 * @return {Object} A mock registry.
 */
function registryWithResolvedReport( resolvedReport, fetchReports ) {
	let call = 0;
	const fetchGetReport = jest.fn( () =>
		Promise.resolve( { response: fetchReports[ call++ ] } )
	);
	return {
		resolveSelect: jest.fn( () => ( {
			getReport: jest.fn( () => Promise.resolve( resolvedReport ) ),
		} ) ),
		dispatch: jest.fn( () => ( { fetchGetReport } ) ),
	};
}

/**
 * Loads a tile that reads a report before deciding what to fetch.
 *
 * @since 1.186.0
 *
 * @param {string}   slug           The key metric slug.
 * @param {Object}   resolvedReport The report the tile reads up front.
 * @param {Object[]} fetchReports   The report responses the tile then fetches.
 * @return {Promise<Object|null>} The resolved tile data.
 */
function loadPrecheckedTile( slug, resolvedReport, fetchReports ) {
	return KEY_METRICS_PDF_TILES[ slug ].getTileData( {
		registry: registryWithResolvedReport( resolvedReport, fetchReports ),
		dates: DATES,
		signal: new AbortController().signal,
	} );
}

/**
 * Loads the New Visitors tile data against the given report fixture.
 *
 * @since 1.184.0
 *
 * @param {Object} report The report response the tile fetches.
 * @return {Promise<Object|null>} The resolved tile data.
 */
function loadNewVisitorsTile( report ) {
	return loadTile( KM_ANALYTICS_NEW_VISITORS, report );
}

describe( 'KEY_METRICS_PDF_TILES', () => {
	it( 'defines a PDF tile config for the New Visitors metric', () => {
		const pdfTile = KEY_METRICS_PDF_TILES[ KM_ANALYTICS_NEW_VISITORS ];

		expect( pdfTile ).toBeDefined();
		expect( pdfTile.TileComponent ).toBeDefined();
		expect( typeof pdfTile.getTileData ).toBe( 'function' );
	} );

	it( 'gives every Key Metric a PDF tile with a TileComponent and getTileData', () => {
		const slugs = Object.keys( KEY_METRICS_WIDGETS );
		expect( slugs.length ).toBeGreaterThan( 0 );

		// Every metric a user can add to their dashboard renders in the PDF.
		slugs.forEach( ( slug ) => {
			const pdfTile = KEY_METRICS_PDF_TILES[ slug ];
			expect( pdfTile ).toBeDefined();
			expect( pdfTile.TileComponent ).toBeDefined();
			expect( typeof pdfTile.getTileData ).toBe( 'function' );
		} );
	} );

	describe( 'New Visitors getTileData', () => {
		it( 'reads the prominent value from the new visitors row, not the total, and the change from the totals', async () => {
			// New visitors is 500 for the current period; the total (1,200) is
			// only used for the change against the previous total (1,000).
			const report = {
				rows: [
					{
						dimensionValues: [
							{ value: 'new' },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '500' } ],
					},
					{
						dimensionValues: [
							{ value: 'returning' },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '700' } ],
					},
				],
				totals: [
					{ metricValues: [ { value: '1200' } ] },
					{ metricValues: [ { value: '1000' } ] },
				],
			};

			const data = await loadNewVisitorsTile( report );

			// The value is the new visitors count, not the 1,200 total.
			expect( data.value ).toBe( numFmt( 500 ) );
			expect( data.value ).not.toBe( numFmt( 1200 ) );
			// The total rose 1,000 -> 1,200, so the change is positive.
			expect( data.changeType ).toBe( 'positive' );
			expect( data.change ).toEqual( expect.stringContaining( '20' ) );
			// The subtext reads the total visitors, matching the dashboard tile.
			expect( data.subtext ).toContain(
				numFmt( 1200, { style: 'decimal' } )
			);
			expect( data.subtext ).toContain( 'total visitors' );
		} );

		it( 'marks the change negative from the totals even when new visitors is high', async () => {
			// New visitors is high (900), but the total fell 1,000 -> 800, so
			// the change must track the totals and read as negative.
			const report = {
				rows: [
					{
						dimensionValues: [
							{ value: 'new' },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '900' } ],
					},
				],
				totals: [
					{ metricValues: [ { value: '800' } ] },
					{ metricValues: [ { value: '1000' } ] },
				],
			};

			const data = await loadNewVisitorsTile( report );

			expect( data.value ).toBe( numFmt( 900 ) );
			expect( data.changeType ).toBe( 'negative' );
		} );

		it( 'returns null when the report has no rows, so the tile is dropped', async () => {
			const data = await loadNewVisitorsTile( {} );

			expect( data ).toBeNull();
		} );

		it( 'keeps the compare dates, since the change needs the previous period', async () => {
			const fetchGetReport = jest.fn( () =>
				Promise.resolve( { response: {} } )
			);
			const registry = {
				dispatch: jest.fn( () => ( { fetchGetReport } ) ),
			};

			await KEY_METRICS_PDF_TILES[
				KM_ANALYTICS_NEW_VISITORS
			].getTileData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			const options = fetchGetReport.mock.calls[ 0 ][ 0 ];
			expect( options.compareStartDate ).toBe( DATES.compareStartDate );
			expect( options.compareEndDate ).toBe( DATES.compareEndDate );
		} );
	} );

	describe( 'Returning Visitors getTileData (numeric family, percentage)', () => {
		it( 'reads the returning share and the absolute point change', async () => {
			// 300 of 1,000 returned this period (30%); 200 of 1,000 the previous
			// period (20%), so the absolute change is +10 points.
			const report = {
				rows: [
					{
						dimensionValues: [
							{ value: 'returning' },
							{ value: 'date_range_0' },
						],
						metricValues: [ { value: '300' } ],
					},
					{
						dimensionValues: [
							{ value: 'returning' },
							{ value: 'date_range_1' },
						],
						metricValues: [ { value: '200' } ],
					},
				],
				totals: [
					{ metricValues: [ { value: '1000' } ] },
					{ metricValues: [ { value: '1000' } ] },
				],
			};

			const data = await loadTile(
				KM_ANALYTICS_RETURNING_VISITORS,
				report
			);

			// The value is the returning share, formatted as a percentage.
			expect( data.value ).toBe(
				numFmt( 0.3, {
					style: 'percent',
					signDisplay: 'never',
					maximumFractionDigits: 1,
				} )
			);
			// The badge shows the absolute point change (30% - 20% = +10%).
			expect( data.changeType ).toBe( 'positive' );
			expect( data.change ).toEqual( expect.stringContaining( '10' ) );
			expect( data.subtext ).toContain(
				numFmt( 1000, { style: 'decimal' } )
			);
			expect( data.subtext ).toContain( 'total visitors' );
		} );

		it( 'returns null when the report has no rows, so the tile is dropped', async () => {
			const data = await loadTile( KM_ANALYTICS_RETURNING_VISITORS, {} );

			expect( data ).toBeNull();
		} );
	} );

	describe( 'Top Traffic Source getTileData (text family, two reports)', () => {
		// The tile combines a total-users report and a per-channel report.
		const totalReport = {
			rows: [
				{
					dimensionValues: [ { value: 'date_range_0' } ],
					metricValues: [ { value: '1000' } ],
				},
				{
					dimensionValues: [ { value: 'date_range_1' } ],
					metricValues: [ { value: '800' } ],
				},
			],
		};
		const sourceReport = {
			rows: [
				{
					dimensionValues: [
						{ value: 'Organic Search' },
						{ value: 'date_range_0' },
					],
					metricValues: [ { value: '400' } ],
				},
				{
					dimensionValues: [
						{ value: 'Organic Search' },
						{ value: 'date_range_1' },
					],
					metricValues: [ { value: '200' } ],
				},
			],
		};

		it( 'reads the top channel, its share, and the absolute point change', async () => {
			const data = await loadTileWithReports(
				KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
				[ totalReport, sourceReport ]
			);

			// The value is the top channel name.
			expect( data.value ).toBe( 'Organic Search' );
			// 400 / 1,000 = 40% this period; the sub-text shows the share.
			expect( data.subtext ).toContain(
				numFmt( 0.4, {
					style: 'percent',
					signDisplay: 'never',
					maximumFractionDigits: 1,
				} )
			);
			expect( data.subtext ).toContain( 'of total traffic' );
			// 40% vs 25% (200/800) previous, so the absolute change is +15 points.
			expect( data.changeType ).toBe( 'positive' );
			expect( data.change ).toEqual( expect.stringContaining( '15' ) );
		} );

		it( 'returns null when the per-channel report has no rows', async () => {
			const data = await loadTileWithReports(
				KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
				[ totalReport, {} ]
			);

			expect( data ).toBeNull();
		} );
	} );

	describe( 'Top Cities getTileData (table family, ranked share)', () => {
		it( 'maps the top cities to share rows, dropping "(not set)" and capping the list', async () => {
			const report = {
				totals: [ { metricValues: [ { value: '1000' } ] } ],
				rows: [
					{
						dimensionValues: [ { value: 'Dublin' } ],
						metricValues: [ { value: '500' } ],
					},
					{
						dimensionValues: [ { value: 'London' } ],
						metricValues: [ { value: '250' } ],
					},
					{
						dimensionValues: [ { value: '(not set)' } ],
						metricValues: [ { value: '150' } ],
					},
					{
						dimensionValues: [ { value: 'Paris' } ],
						metricValues: [ { value: '100' } ],
					},
				],
			};

			const data = await loadTile( KM_ANALYTICS_TOP_CITIES, report );

			// Each city's share of total users, "(not set)" dropped.
			expect( data.rows ).toEqual( [
				{ primary: 'Dublin', metric: numFmt( 0.5, PERCENT_1DP ) },
				{ primary: 'London', metric: numFmt( 0.25, PERCENT_1DP ) },
				{ primary: 'Paris', metric: numFmt( 0.1, PERCENT_1DP ) },
			] );
		} );

		it( 'returns null when the report has no rows, so the tile is dropped', async () => {
			const data = await loadTile( KM_ANALYTICS_TOP_CITIES, {
				rows: [],
				totals: [],
			} );

			expect( data ).toBeNull();
		} );

		it( 'requests a single date range, dropping the export compare dates', async () => {
			// Table tiles mirror single-range dashboard widgets; passing the
			// export's compare dates would make GA4 add a second date range and
			// return previous-period rows the table would then show.
			const fetchGetReport = jest.fn( () =>
				Promise.resolve( { response: { rows: [], totals: [] } } )
			);
			const registry = {
				dispatch: jest.fn( () => ( { fetchGetReport } ) ),
			};

			await KEY_METRICS_PDF_TILES[ KM_ANALYTICS_TOP_CITIES ].getTileData(
				{
					registry,
					dates: DATES,
					signal: new AbortController().signal,
				}
			);

			const options = fetchGetReport.mock.calls[ 0 ][ 0 ];
			expect( options.startDate ).toBe( DATES.startDate );
			expect( options.endDate ).toBe( DATES.endDate );
			expect( options.compareStartDate ).toBeUndefined();
			expect( options.compareEndDate ).toBeUndefined();
		} );
	} );

	describe( 'Top Traffic Source Driving Purchases getTileData (purchase pre-check)', () => {
		// The per-source report always names a top source, because
		// `ecommercePurchases` reports a zero-valued row rather than no data.
		const sourceReport = {
			rows: [
				{
					dimensionValues: [
						{ value: 'Organic Search' },
						{ value: 'date_range_0' },
					],
					metricValues: [ { value: '5' } ],
				},
			],
		};

		it( 'drops the tile when no period has a purchase, despite a named top source', async () => {
			const noPurchases = {
				rows: [
					{
						dimensionValues: [ { value: 'date_range_0' } ],
						metricValues: [ { value: '0' } ],
					},
					{
						dimensionValues: [ { value: 'date_range_1' } ],
						metricValues: [ { value: '0' } ],
					},
				],
			};

			const data = await loadPrecheckedTile(
				KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
				noPurchases,
				[ noPurchases, sourceReport ]
			);

			expect( data ).toBeNull();
		} );

		it( 'renders the top source when at least one period has a purchase', async () => {
			const withPurchases = {
				rows: [
					{
						dimensionValues: [ { value: 'date_range_0' } ],
						metricValues: [ { value: '10' } ],
					},
					{
						dimensionValues: [ { value: 'date_range_1' } ],
						metricValues: [ { value: '8' } ],
					},
				],
			};

			const data = await loadPrecheckedTile(
				KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
				withPurchases,
				[ withPurchases, sourceReport ]
			);

			expect( data ).not.toBeNull();
			expect( data.value ).toBe( 'Organic Search' );
		} );
	} );
} );

describe( 'Selling products Key Metric tiles', () => {
	const SELLING_PRODUCTS_SLUGS = [
		KM_ANALYTICS_TOTAL_SALES,
		KM_ANALYTICS_SALES_RATE,
		KM_ANALYTICS_SALES_ENGAGEMENT_RATE,
		KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_SALES_RATE,
		KM_ANALYTICS_SALES_BY_VISITOR_TYPE,
		KM_ANALYTICS_SALES_BY_COUNTRIES,
		KM_ANALYTICS_TOP_AUTHORS_DRIVING_SALES,
		KM_ANALYTICS_TOP_PAGES_DRIVING_SALES,
	];

	it.each( SELLING_PRODUCTS_SLUGS )(
		'should offer %s when purchase is detected',
		( slug ) => {
			const widget = KEY_METRICS_WIDGETS[ slug ];
			const select = makeSelect( {
				detectedEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
			} );

			expect( widget.displayInSelectionPanel( { select, slug } ) ).toBe(
				true
			);
			expect( widget.displayInList( { select, slug } ) ).toBe( true );
		}
	);

	it.each( SELLING_PRODUCTS_SLUGS )(
		'should not offer %s when purchase has not been detected',
		( slug ) => {
			const widget = KEY_METRICS_WIDGETS[ slug ];
			const select = makeSelect( {
				detectedEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
			} );

			expect( widget.displayInSelectionPanel( { select, slug } ) ).toBe(
				false
			);
			expect( widget.displayInList( { select, slug } ) ).toBe( false );
		}
	);

	describe( 'Top authors driving sales', () => {
		const slug = KM_ANALYTICS_TOP_AUTHORS_DRIVING_SALES;

		it( 'should additionally require the post author custom dimension on a view-only dashboard', () => {
			const widget = KEY_METRICS_WIDGETS[ slug ];

			expect(
				widget.displayInWidgetArea( {
					select: makeSelect( {
						detectedEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
						availableCustomDimensions: [],
					} ),
					isViewOnlyDashboard: true,
					slug,
				} )
			).toBe( false );

			expect(
				widget.displayInWidgetArea( {
					select: makeSelect( {
						detectedEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
						availableCustomDimensions: [
							'googlesitekit_post_author',
						],
					} ),
					isViewOnlyDashboard: true,
					slug,
				} )
			).toBe( true );
		} );

		it( 'should not be offered on a view-only dashboard when the post author custom dimension is unavailable', () => {
			const widget = KEY_METRICS_WIDGETS[ slug ];
			const select = makeSelect( {
				detectedEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
				availableCustomDimensions: [],
			} );

			expect(
				widget.displayInSelectionPanel( {
					select,
					isViewOnlyDashboard: true,
					slug,
				} )
			).toBe( false );

			expect(
				widget.displayInList( {
					select,
					isViewOnlyDashboard: true,
					slug,
				} )
			).toBe( false );
		} );
	} );
} );

describe( 'Generating leads Key Metric tiles', () => {
	const GENERATING_LEADS_SLUGS = [
		KM_ANALYTICS_TOTAL_FORM_COMPLETIONS,
		KM_ANALYTICS_FORM_COMPLETION_RATE,
		KM_ANALYTICS_FORM_COMPLETION_ENGAGEMENT_RATE,
		KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_FORM_COMPLETION_RATE,
		KM_ANALYTICS_LEADS_BY_VISITOR_TYPE,
		KM_ANALYTICS_LEADS_BY_COUNTRIES,
		KM_ANALYTICS_LEADS_BY_DEVICE_TYPE,
		KM_ANALYTICS_TOP_AUTHORS_DRIVING_LEADS,
	];

	it.each( GENERATING_LEADS_SLUGS )(
		'should offer %s when any lead event is detected',
		( slug ) => {
			const widget = KEY_METRICS_WIDGETS[ slug ];
			const select = makeSelect( {
				detectedEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
			} );

			expect( widget.displayInSelectionPanel( { select, slug } ) ).toBe(
				true
			);
			expect( widget.displayInList( { select, slug } ) ).toBe( true );
		}
	);

	it.each( GENERATING_LEADS_SLUGS )(
		'should not offer %s when no lead event has been detected',
		( slug ) => {
			const widget = KEY_METRICS_WIDGETS[ slug ];
			const select = makeSelect( {
				detectedEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
			} );

			expect( widget.displayInSelectionPanel( { select, slug } ) ).toBe(
				false
			);
			expect( widget.displayInList( { select, slug } ) ).toBe( false );
		}
	);

	describe( 'Top authors driving leads', () => {
		const slug = KM_ANALYTICS_TOP_AUTHORS_DRIVING_LEADS;

		it( 'should additionally require the post author custom dimension on a view-only dashboard', () => {
			const widget = KEY_METRICS_WIDGETS[ slug ];

			expect(
				widget.displayInWidgetArea( {
					select: makeSelect( {
						detectedEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
						availableCustomDimensions: [],
					} ),
					isViewOnlyDashboard: true,
					slug,
				} )
			).toBe( false );

			expect(
				widget.displayInWidgetArea( {
					select: makeSelect( {
						detectedEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
						availableCustomDimensions: [
							'googlesitekit_post_author',
						],
					} ),
					isViewOnlyDashboard: true,
					slug,
				} )
			).toBe( true );
		} );

		it( 'should not be offered on a view-only dashboard when the post author custom dimension is unavailable', () => {
			const widget = KEY_METRICS_WIDGETS[ slug ];
			const select = makeSelect( {
				detectedEvents: [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ],
				availableCustomDimensions: [],
			} );

			expect(
				widget.displayInSelectionPanel( {
					select,
					isViewOnlyDashboard: true,
					slug,
				} )
			).toBe( false );

			expect(
				widget.displayInList( {
					select,
					isViewOnlyDashboard: true,
					slug,
				} )
			).toBe( false );
		} );
	} );
} );

/**
 * Key Metrics PDF tiles smoke tests.
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
import { findTextStrings } from '@/js/components/pdf-export/test-utils';
import {
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
	KM_ANALYTICS_LEAST_ENGAGING_PAGES,
	KM_ANALYTICS_MOST_ENGAGING_PAGES,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
	KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { KEY_METRICS_PDF_TILES } from './key-metrics-pdf-tiles';
import { KEY_METRICS_WIDGETS } from './key-metrics-widgets';

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

/**
 * A report shaped generously enough for every tile family: two ranked rows that
 * each carry a date-range dimension, per-range totals, a row count, a currency
 * code and a page-path dimension header.
 */
const REPORT = {
	rowCount: 2,
	metadata: { currencyCode: 'USD' },
	dimensionHeaders: [ { name: 'pagePath' } ],
	rows: [
		{
			dimensionValues: [
				{ value: '/alpha' },
				{ value: 'date_range_0' },
				{ value: 'date_range_0' },
			],
			metricValues: [ { value: '10' }, { value: '5' } ],
		},
		{
			dimensionValues: [
				{ value: '/beta' },
				{ value: 'date_range_1' },
				{ value: 'date_range_1' },
			],
			metricValues: [ { value: '8' }, { value: '4' } ],
		},
	],
	totals: [
		{
			dimensionValues: [ { value: 'date_range_0' } ],
			metricValues: [ { value: '100' }, { value: '50' } ],
		},
		{
			dimensionValues: [ { value: 'date_range_1' } ],
			metricValues: [ { value: '80' }, { value: '40' } ],
		},
	],
};

/**
 * Search Console report returns a flat array of rows keyed by search query.
 */
const SEARCH_CONSOLE_REPORT = [
	{ keys: [ 'site kit' ], ctr: 0.42, clicks: 120, impressions: 285 },
	{ keys: [ 'analytics plugin' ], ctr: 0.19, clicks: 40, impressions: 210 },
];

/**
 * Builds a registry that answers every selector and fetch a PDF tile can reach,
 * so each tile's `getTileData` can run end to end without real network access.
 *
 * @since 1.186.0
 *
 * @return {Object} A mock registry.
 */
function smokeRegistry() {
	const resolved = {
		getReport: jest.fn( () => Promise.resolve( REPORT ) ),
		getProductPostType: jest.fn( () => Promise.resolve( 'product' ) ),
		getDetectedEvents: jest.fn( () =>
			Promise.resolve( [
				'purchase',
				'add_to_cart',
				'submit_lead_form',
				'contact',
				'generate_lead',
			] )
		),
		getSettings: jest.fn( () => Promise.resolve( {} ) ),
		getReferenceDate: jest.fn( () => Promise.resolve( '2025-02-04' ) ),
	};

	// A single shared object, rather than a fresh one per `select()` call, so a
	// test can inspect `getServiceReportURL`'s calls after `getTileData` resolves.
	const selected = {
		getAccountID: jest.fn( () => 'pub-1234567890' ),
		getReferenceDate: jest.fn( () => '2025-02-04' ),
		getServiceReportURL: jest.fn( () => 'https://example.com/report' ),
		getPrimaryEcommerceEvent: jest.fn( () => 'purchase' ),
	};

	return {
		resolveSelect: jest.fn( () => resolved ),
		select: jest.fn( () => selected ),
		// Search Console reports are a flat array of rows, unlike the Analytics 4
		// `{ rows, totals }` shape, so answer each store with its own shape.
		dispatch: jest.fn( ( store ) => ( {
			fetchGetReport: jest.fn( () =>
				Promise.resolve( {
					response:
						store === MODULES_SEARCH_CONSOLE
							? SEARCH_CONSOLE_REPORT
							: REPORT,
				} )
			),
		} ) ),
	};
}

describe( 'KEY_METRICS_PDF_TILES smoke test', () => {
	it( 'covers every metric a user can add to their dashboard', () => {
		const widgetSlugs = Object.keys( KEY_METRICS_WIDGETS ).sort();
		const tileSlugs = Object.keys( KEY_METRICS_PDF_TILES ).sort();

		expect( tileSlugs ).toEqual( widgetSlugs );
	} );

	it.each( Object.keys( KEY_METRICS_PDF_TILES ) )(
		'%s resolves its tile data without throwing',
		async ( slug ) => {
			const { TileComponent, getTileData } =
				KEY_METRICS_PDF_TILES[ slug ];

			expect( TileComponent ).toBeDefined();

			const data = await getTileData( {
				registry: smokeRegistry(),
				dates: DATES,
				signal: new AbortController().signal,
			} );

			// A tile either resolves data for its component, or returns `null`
			// when its report has no data. Anything else means the extract broke.
			if ( data !== null ) {
				expect( typeof data ).toBe( 'object' );
			}
		}
	);

	it.each( Object.keys( KEY_METRICS_PDF_TILES ) )(
		'%s renders its resolved data into the PDF tile',
		async ( slug ) => {
			const { TileComponent, getTileData } =
				KEY_METRICS_PDF_TILES[ slug ];

			const data = await getTileData( {
				registry: smokeRegistry(),
				dates: DATES,
				signal: new AbortController().signal,
			} );

			// A tile with no data is dropped before it ever renders.
			expect( data ).not.toBeNull();

			// The tile components are lazy so the dashboard bundle stays free of
			// the PDF renderer; resolve the real component before rendering it.
			const { default: Resolved } = await TileComponent.preload();
			const { title } = KEY_METRICS_WIDGETS[ slug ];

			const tree = TestRenderer.create(
				<Resolved title={ title } { ...data } />
			).toJSON();

			expect( tree ).toBeTruthy();

			const text = findTextStrings( tree );
			// The heading always renders, plus at least one value or row.
			expect( text ).toContain( title );
			expect( text.length ).toBeGreaterThan( 1 );
		}
	);

	describe( 'row links', () => {
		// The table tiles narrow the export's compare-range dates to a single
		// period before building a report, so a row's link is built from this.
		const SINGLE_PERIOD_DATES = {
			startDate: DATES.startDate,
			endDate: DATES.endDate,
		};

		it( 'builds a page tile row URL from its page path and the single-period dates', async () => {
			const registry = smokeRegistry();
			const { getTileData } =
				KEY_METRICS_PDF_TILES[ KM_ANALYTICS_POPULAR_CONTENT ];

			const data = await getTileData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect(
				registry.select().getServiceReportURL
			).toHaveBeenCalledWith( 'all-pages-and-screens', {
				filters: { unifiedPagePathScreen: '/alpha' },
				dates: SINGLE_PERIOD_DATES,
			} );
			expect( data.rows[ 0 ].primaryURL ).toBe(
				'https://example.com/report'
			);
		} );

		it( 'builds the top earning content tile row URL from the Analytics page report', async () => {
			const registry = smokeRegistry();
			const { getTileData } =
				KEY_METRICS_PDF_TILES[
					KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT
				];

			const data = await getTileData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect(
				registry.select().getServiceReportURL
			).toHaveBeenCalledWith( 'all-pages-and-screens', {
				filters: { unifiedPagePathScreen: '/alpha' },
				dates: SINGLE_PERIOD_DATES,
			} );
			expect( data.rows[ 0 ].primaryURL ).toBe(
				'https://example.com/report'
			);
		} );

		it.each( [
			KM_ANALYTICS_POPULAR_PRODUCTS,
			KM_ANALYTICS_MOST_ENGAGING_PAGES,
			KM_ANALYTICS_LEAST_ENGAGING_PAGES,
			KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
			KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
		] )(
			'%s builds each row URL from its page path and the single-period dates',
			async ( slug ) => {
				const registry = smokeRegistry();
				const { getTileData } = KEY_METRICS_PDF_TILES[ slug ];

				const data = await getTileData( {
					registry,
					dates: DATES,
					signal: new AbortController().signal,
				} );

				expect(
					registry.select().getServiceReportURL
				).toHaveBeenCalledWith( 'all-pages-and-screens', {
					filters: { unifiedPagePathScreen: '/alpha' },
					dates: SINGLE_PERIOD_DATES,
				} );
				expect( data.rows[ 0 ].primaryURL ).toBe(
					'https://example.com/report'
				);
			}
		);

		it( 'builds the trending pages tile row URL from its own fixed 3-day window, not the export date range', async () => {
			const registry = smokeRegistry();
			const { getTileData } =
				KEY_METRICS_PDF_TILES[ KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES ];

			await getTileData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			// The smoke registry resolves the reference date to '2025-02-04', so
			// the tile's own fixed window (yesterday to 3 days ago) is
			// 2025-02-01–2025-02-03 — distinct from the export's DATES range
			// above, proving the row link doesn't use the export's date range.
			expect(
				registry.select().getServiceReportURL
			).toHaveBeenCalledWith( 'all-pages-and-screens', {
				filters: { unifiedPagePathScreen: '/alpha' },
				dates: { startDate: '2025-02-01', endDate: '2025-02-03' },
			} );
		} );

		it( 'builds an exact-match Search Console URL for the keywords tile', async () => {
			const registry = smokeRegistry();
			const { getTileData } =
				KEY_METRICS_PDF_TILES[ KM_SEARCH_CONSOLE_POPULAR_KEYWORDS ];

			const data = await getTileData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			// The exclamation mark forces an exact match on the query.
			expect(
				registry.select().getServiceReportURL
			).toHaveBeenCalledWith(
				expect.objectContaining( { query: '!site kit' } )
			);
			expect( data.rows[ 0 ].primaryURL ).toBe(
				'https://example.com/report'
			);
		} );

		it.each( [
			KM_ANALYTICS_POPULAR_CONTENT,
			KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
		] )(
			'returns a null primaryURL for any row of %s when viewOnly is true',
			async ( slug ) => {
				const registry = smokeRegistry();
				const { getTileData } = KEY_METRICS_PDF_TILES[ slug ];

				const data = await getTileData( {
					registry,
					dates: DATES,
					signal: new AbortController().signal,
					viewOnly: true,
				} );

				expect(
					registry.select().getServiceReportURL
				).not.toHaveBeenCalled();
				data.rows.forEach( ( row ) => {
					expect( row.primaryURL ).toBeNull();
				} );
			}
		);
	} );
} );

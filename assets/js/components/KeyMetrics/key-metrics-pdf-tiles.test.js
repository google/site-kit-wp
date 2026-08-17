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
 * @since n.e.x.t
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

	return {
		resolveSelect: jest.fn( () => resolved ),
		select: jest.fn( () => ( {
			getAccountID: jest.fn( () => 'pub-1234567890' ),
			getReferenceDate: jest.fn( () => '2025-02-04' ),
		} ) ),
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
} );

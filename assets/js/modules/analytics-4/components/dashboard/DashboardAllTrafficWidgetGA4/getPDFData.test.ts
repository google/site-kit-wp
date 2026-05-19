/**
 * DashboardAllTrafficWidgetGA4 getPDFData tests.
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
import getPDFData from './getPDFData';
import { GRAPH_REPORT_ID, TOTALS_REPORT_ID } from './reportOptions';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';

interface MockGetReport {
	( args: Record< string, unknown > ): Promise< Record< string, unknown > >;
	mock: { calls: Array< [ Record< string, unknown > ] > };
}

interface MockRegistry {
	resolveSelect: jest.Mock;
	select: jest.Mock;
}

function buildRegistry( {
	totalsReport,
	graphReport,
	entityURL,
}: {
	totalsReport: Record< string, unknown >;
	graphReport: Record< string, unknown >;
	entityURL?: string;
} ): { registry: MockRegistry; getReport: MockGetReport } {
	const getReport = jest.fn( ( args: Record< string, unknown > ) => {
		if ( args.reportID === TOTALS_REPORT_ID ) {
			return Promise.resolve( totalsReport );
		}
		if ( args.reportID === GRAPH_REPORT_ID ) {
			return Promise.resolve( graphReport );
		}
		return Promise.resolve( undefined );
	} );

	const resolveSelect = jest.fn( ( storeName: string ) => {
		if ( storeName === MODULES_ANALYTICS_4 ) {
			return { getReport };
		}
		throw new Error( `Unexpected resolveSelect store: ${ storeName }` );
	} );

	const select = jest.fn( ( storeName: string ) => {
		if ( storeName === CORE_SITE ) {
			return {
				getCurrentEntityURL: () => entityURL || null,
			};
		}
		throw new Error( `Unexpected select store: ${ storeName }` );
	} );

	return {
		registry: { resolveSelect, select },
		getReport: getReport as unknown as MockGetReport,
	};
}

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

describe( 'DashboardAllTrafficWidgetGA4 getPDFData', () => {
	it( 'resolves both totals and graph reports in parallel and returns the expected shape', async () => {
		const totalsReport = {
			totals: [ { metricValues: [ { value: '100' } ] } ],
		};
		const graphReport = { rows: [ { metricValues: [ { value: '10' } ] } ] };
		const { registry, getReport } = buildRegistry( {
			totalsReport,
			graphReport,
		} );

		const signal = new AbortController().signal;

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal,
		} );

		expect( result ).toEqual( {
			data: {
				totalsReport,
				graphReport,
			},
		} );

		// Both reports were requested.
		expect( getReport.mock.calls ).toHaveLength( 2 );

		const reportIDs = getReport.mock.calls.map(
			( [ args ] ) => args.reportID
		);
		expect( reportIDs ).toEqual(
			expect.arrayContaining( [ TOTALS_REPORT_ID, GRAPH_REPORT_ID ] )
		);

		// The totals request includes the comparison dates.
		const totalsCall = getReport.mock.calls.find(
			( [ args ] ) => args.reportID === TOTALS_REPORT_ID
		);
		expect( totalsCall?.[ 0 ] ).toMatchObject( {
			startDate: DATES.startDate,
			endDate: DATES.endDate,
			compareStartDate: DATES.compareStartDate,
			compareEndDate: DATES.compareEndDate,
			metrics: [ { name: 'totalUsers' } ],
		} );

		// The graph request includes the date dimension.
		const graphCall = getReport.mock.calls.find(
			( [ args ] ) => args.reportID === GRAPH_REPORT_ID
		);
		expect( graphCall?.[ 0 ] ).toMatchObject( {
			startDate: DATES.startDate,
			endDate: DATES.endDate,
			dimensions: [ 'date' ],
			metrics: [ { name: 'totalUsers' } ],
		} );
	} );

	it( 'forwards the current entity URL when one is set', async () => {
		const { registry, getReport } = buildRegistry( {
			totalsReport: {},
			graphReport: {},
			entityURL: 'https://example.com/post-1',
		} );

		await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		for ( const [ args ] of getReport.mock.calls ) {
			expect( args.url ).toBe( 'https://example.com/post-1' );
		}
	} );

	it( 'short-circuits without dispatching when signal is already aborted', async () => {
		const { registry, getReport } = buildRegistry( {
			totalsReport: {},
			graphReport: {},
		} );

		const controller = new AbortController();
		controller.abort();

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		expect( result ).toEqual( { data: null } );
		expect( getReport ).not.toHaveBeenCalled();
	} );

	it( 'short-circuits when signal aborts between the dispatch and the resolve', async () => {
		const controller = new AbortController();
		const totalsReport = { totals: [] };
		const graphReport = { rows: [] };

		const getReport = jest.fn( ( args: Record< string, unknown > ) => {
			// Abort between dispatch (call site) and resolution.
			return new Promise( ( resolve ) => {
				setTimeout( () => {
					controller.abort();
					if ( args.reportID === TOTALS_REPORT_ID ) {
						resolve( totalsReport );
					} else {
						resolve( graphReport );
					}
				}, 0 );
			} );
		} );

		const registry: MockRegistry = {
			resolveSelect: jest.fn( () => ( { getReport } ) ),
			select: jest.fn( () => ( {
				getCurrentEntityURL: () => null,
			} ) ),
		};

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		expect( result ).toEqual( { data: null } );
		expect( getReport ).toHaveBeenCalledTimes( 2 );
	} );
} );

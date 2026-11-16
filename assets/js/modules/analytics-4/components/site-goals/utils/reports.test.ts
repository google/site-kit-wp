/**
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
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { processReports } from './reports';

function eventRow( eventName: string, dateRange: string, count: number ) {
	return {
		dimensionValues: [ { value: eventName }, { value: dateRange } ],
		metricValues: [ { value: String( count ) } ],
	};
}

function totalsRow( dateRange: string, values: number[] ) {
	return {
		dimensionValues: [ { value: dateRange } ],
		metricValues: values.map( ( value ) => ( { value: String( value ) } ) ),
	};
}

// 1,000 site sessions in the current period, 800 in the previous one.
const engagementReport = {
	totals: [
		totalsRow( 'date_range_0', [ 0.6, 1000 ] ),
		totalsRow( 'date_range_1', [ 0.5, 800 ] ),
	],
} as unknown as Report;

describe( 'processReports', () => {
	it( 'returns the share of sessions with a Key action, not the event count over sessions', () => {
		// 50 sessions each add 6 products to the cart.
		const eventsReport = {
			rows: [
				eventRow( 'add_to_cart', 'date_range_0', 300 ),
				eventRow( 'add_to_cart', 'date_range_1', 120 ),
			],
		} as unknown as Report;
		const keyActionSessionsReport = {
			totals: [
				totalsRow( 'date_range_0', [ 50 ] ),
				totalsRow( 'date_range_1', [ 40 ] ),
			],
		} as unknown as Report;

		const result = processReports( eventsReport, engagementReport, {
			keyActionSessionsReport,
		} );

		expect( result ).toMatchObject( {
			currentRate: 0.05,
			previousRate: 0.05,
			currentPrimaryCount: 300,
			previousPrimaryCount: 120,
			currentSessions: 1000,
		} );
	} );

	it( 'never returns a rate above 1 when there are more events than sessions', () => {
		const eventsReport = {
			rows: [
				eventRow( 'purchase', 'date_range_0', 6000 ),
				eventRow( 'purchase', 'date_range_1', 4800 ),
			],
		} as unknown as Report;
		const keyActionSessionsReport = {
			totals: [
				totalsRow( 'date_range_0', [ 1000 ] ),
				totalsRow( 'date_range_1', [ 800 ] ),
			],
		} as unknown as Report;

		const { currentRate, previousRate } = processReports(
			eventsReport,
			engagementReport,
			{ keyActionSessionsReport }
		);

		expect( currentRate ).toBe( 1 );
		expect( previousRate ).toBe( 1 );
	} );

	it( 'counts a session with several lead events once', () => {
		// 100 sessions each hold a `submit_lead_form` and a `contact` event.
		const eventsReport = {
			rows: [
				eventRow( 'submit_lead_form', 'date_range_0', 100 ),
				eventRow( 'contact', 'date_range_0', 100 ),
				eventRow( 'submit_lead_form', 'date_range_1', 40 ),
				eventRow( 'contact', 'date_range_1', 40 ),
			],
		} as unknown as Report;
		const keyActionSessionsReport = {
			totals: [
				totalsRow( 'date_range_0', [ 100 ] ),
				totalsRow( 'date_range_1', [ 40 ] ),
			],
		} as unknown as Report;

		const result = processReports( eventsReport, engagementReport, {
			aggregate: true,
			keyActionSessionsReport,
		} );

		expect( result ).toMatchObject( {
			currentRate: 0.1,
			previousRate: 0.05,
			currentPrimaryCount: 200,
			previousPrimaryCount: 80,
		} );
	} );

	it( 'returns a zero rate when there are no sessions', () => {
		const { currentRate, previousRate } = processReports(
			{} as Report,
			{} as Report,
			{ keyActionSessionsReport: {} as Report }
		);

		expect( currentRate ).toBe( 0 );
		expect( previousRate ).toBe( 0 );
	} );

	it( 'falls back to the event count over sessions without a Key action sessions report', () => {
		const eventsReport = {
			rows: [
				eventRow( 'purchase', 'date_range_0', 100 ),
				eventRow( 'purchase', 'date_range_1', 40 ),
			],
		} as unknown as Report;

		const { currentRate, previousRate } = processReports(
			eventsReport,
			engagementReport
		);

		expect( currentRate ).toBe( 0.1 );
		expect( previousRate ).toBe( 0.05 );
	} );
} );

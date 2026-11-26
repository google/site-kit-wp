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
import {
	getKeyActionRates,
	getReportsToCheck,
	processReports,
} from './reports';

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

function keyActionSessionsReport( current: number, previous: number ) {
	return {
		totals: [
			totalsRow( 'date_range_0', [ current ] ),
			totalsRow( 'date_range_1', [ previous ] ),
		],
	} as unknown as Report;
}

// 1,000 site sessions in the current period, 800 in the previous one.
const engagementReport = {
	totals: [
		totalsRow( 'date_range_0', [ 0.6, 1000 ] ),
		totalsRow( 'date_range_1', [ 0.5, 800 ] ),
	],
} as unknown as Report;

describe( 'getKeyActionRates', () => {
	it( 'should return the share of site sessions with a Key action', () => {
		// 50 sessions each add 6 products to the cart: 300 events.
		expect(
			getKeyActionRates(
				keyActionSessionsReport( 50, 20 ),
				engagementReport
			)
		).toEqual( {
			currentRate: 0.05,
			// 20 of the previous period's 800 sessions.
			previousRate: 0.025,
			currentSessions: 1000,
		} );
	} );

	it( 'should never return a rate above 1', () => {
		const { currentRate, previousRate } = getKeyActionRates(
			keyActionSessionsReport( 1000, 800 ),
			engagementReport
		);

		expect( currentRate ).toBe( 1 );
		expect( previousRate ).toBe( 1 );
	} );

	it( 'should return a zero rate when there are no sessions', () => {
		expect( getKeyActionRates( {} as Report, {} as Report ) ).toEqual( {
			currentRate: 0,
			previousRate: 0,
			currentSessions: 0,
		} );
	} );
} );

describe( 'processReports', () => {
	it( 'should return the event counts and engagement values', () => {
		const eventsReport = {
			rows: [
				eventRow( 'add_to_cart', 'date_range_0', 300 ),
				eventRow( 'add_to_cart', 'date_range_1', 120 ),
			],
		} as unknown as Report;

		expect( processReports( eventsReport, engagementReport ) ).toEqual( {
			currentPrimaryCount: 300,
			previousPrimaryCount: 120,
			currentSessions: 1000,
			currentEngagementRate: 0.6,
			previousEngagementRate: 0.5,
		} );
	} );

	it( 'should sum the counts of several lead events', () => {
		const eventsReport = {
			rows: [
				eventRow( 'submit_lead_form', 'date_range_0', 100 ),
				eventRow( 'contact', 'date_range_0', 100 ),
				eventRow( 'submit_lead_form', 'date_range_1', 40 ),
				eventRow( 'contact', 'date_range_1', 40 ),
			],
		} as unknown as Report;

		expect(
			processReports( eventsReport, engagementReport, {
				aggregate: true,
			} )
		).toMatchObject( {
			currentPrimaryCount: 200,
			previousPrimaryCount: 80,
		} );
	} );
} );

describe( 'getReportsToCheck', () => {
	it( 'should leave out the reports the widget does not request', () => {
		const eventsOptions = {
			startDate: '2026-01-01',
			endDate: '2026-01-28',
			metrics: [ { name: 'eventCount' } ],
		};
		const engagementOptions = {
			startDate: '2026-01-01',
			endDate: '2026-01-28',
			metrics: [ { name: 'sessions' } ],
		};

		expect(
			getReportsToCheck( eventsOptions, null, engagementOptions )
		).toEqual( [ eventsOptions, engagementOptions ] );
	} );
} );

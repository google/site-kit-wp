/**
 * Tests for the Conversion Insights client-side preprocessing.
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
	assembleConversionInsightEvents,
	buildConversionInsightReportOptions,
	getConversionInsightDateRanges,
} from './preprocess';

const REFERENCE_DATE = '2026-05-15';

function siteWideReport() {
	return {
		totals: [
			{
				dimensionValues: [ { value: 'date_range_0' } ],
				metricValues: [ { value: '0.66' }, { value: '6000' } ],
			},
			{
				dimensionValues: [ { value: 'date_range_1' } ],
				metricValues: [ { value: '0.60' }, { value: '5000' } ],
			},
		],
	};
}

function eventReport() {
	return {
		rows: [
			{
				dimensionValues: [
					{ value: 'submit_lead_form' },
					{ value: 'date_range_0' },
				],
				metricValues: [ { value: '150' }, { value: '120' } ],
			},
			{
				dimensionValues: [
					{ value: 'submit_lead_form' },
					{ value: 'date_range_1' },
				],
				metricValues: [ { value: '100' }, { value: '90' } ],
			},
		],
	};
}

function yoyReport() {
	return {
		rows: [
			{
				dimensionValues: [
					{ value: 'submit_lead_form' },
					{ value: 'date_range_0' },
				],
				metricValues: [ { value: '130' } ],
			},
			{
				dimensionValues: [
					{ value: 'submit_lead_form' },
					{ value: 'date_range_1' },
				],
				metricValues: [ { value: '90' } ],
			},
		],
	};
}

describe( 'getConversionInsightDateRanges', () => {
	it( 'derives month-to-date current, full previous month, and YoY windows', () => {
		expect( getConversionInsightDateRanges( REFERENCE_DATE ) ).toEqual( {
			current: { startDate: '2026-05-01', endDate: '2026-05-15' },
			previous: { startDate: '2026-04-01', endDate: '2026-04-30' },
			yoyCurrent: { startDate: '2025-05-01', endDate: '2025-05-15' },
			yoyPrevious: { startDate: '2025-04-01', endDate: '2025-04-30' },
			monthStartDate: '2026-05-01',
		} );
	} );

	it( 'handles the January boundary (previous month is the prior December)', () => {
		expect(
			getConversionInsightDateRanges( '2026-01-10' ).previous
		).toEqual( { startDate: '2025-12-01', endDate: '2025-12-31' } );
	} );
} );

describe( 'buildConversionInsightReportOptions', () => {
	it( 'scopes the per-event reports to the requested events', () => {
		const dateRanges = getConversionInsightDateRanges( REFERENCE_DATE );
		const { eventOptions, yoyOptions } =
			buildConversionInsightReportOptions( dateRanges, [
				'submit_lead_form',
			] );

		expect( eventOptions.dimensionFilters ).toEqual( {
			eventName: {
				filterType: 'inListFilter',
				value: [ 'submit_lead_form' ],
			},
		} );
		// The YoY report reads the YoY windows.
		expect( yoyOptions.startDate ).toBe( '2025-05-01' );
		expect( yoyOptions.compareEndDate ).toBe( '2025-04-30' );
	} );
} );

describe( 'assembleConversionInsightEvents', () => {
	it( 'computes conversion_rate as event sessions / site sessions', () => {
		const events = assembleConversionInsightEvents(
			REFERENCE_DATE,
			[ 'submit_lead_form' ],
			{
				siteWideReport: siteWideReport(),
				eventReport: eventReport(),
				yoyReport: yoyReport(),
			}
		);

		expect( events ).toEqual( [
			{
				key_event_name: 'submit_lead_form',
				month_start_date: '2026-05-01',
				current: {
					conversions: 150,
					// 120 event sessions / 6000 site sessions.
					conversion_rate: 0.02,
					sessions: 6000,
					engagement_rate: 0.66,
				},
				previous: {
					conversions: 100,
					// 90 event sessions / 5000 site sessions.
					conversion_rate: 0.018,
					sessions: 5000,
					engagement_rate: 0.6,
				},
				yoy_current_conversions: 130,
				yoy_previous_conversions: 90,
			},
		] );
	} );

	it( 'zero-backfills events absent from the reports', () => {
		const events = assembleConversionInsightEvents(
			REFERENCE_DATE,
			[ 'never_fired' ],
			{ siteWideReport: siteWideReport(), eventReport: eventReport() }
		);

		expect( events?.[ 0 ].current ).toEqual( {
			conversions: 0,
			conversion_rate: 0,
			sessions: 6000,
			engagement_rate: 0.66,
		} );
	} );

	it( 'guards divide-by-zero when site sessions are zero', () => {
		const events = assembleConversionInsightEvents(
			REFERENCE_DATE,
			[ 'submit_lead_form' ],
			{
				siteWideReport: {
					totals: [
						{
							dimensionValues: [ { value: 'date_range_0' } ],
							metricValues: [ { value: '0.5' }, { value: '0' } ],
						},
					],
				},
				eventReport: eventReport(),
			}
		);

		expect( events?.[ 0 ].current.conversion_rate ).toBe( 0 );
	} );

	it( 'returns null while the required reports are missing', () => {
		expect(
			assembleConversionInsightEvents(
				REFERENCE_DATE,
				[ 'submit_lead_form' ],
				{ siteWideReport: siteWideReport() }
			)
		).toBeNull();
	} );
} );

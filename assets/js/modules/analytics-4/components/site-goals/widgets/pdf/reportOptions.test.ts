/**
 * Site Goals PDF report options tests.
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
	LEAD_BREAKDOWN_DIMENSION,
	STORE_BREAKDOWN_DIMENSION,
	getLeadAggregatedReportOptions,
	getLeadGroupedReportOptions,
	getStoreAggregatedReportOptions,
	getStoreGroupedReportOptions,
} from './reportOptions';

describe( 'Site Goals PDF reportOptions', () => {
	const dates = {
		startDate: '2025-01-08',
		endDate: '2025-02-04',
		compareStartDate: '2024-12-11',
		compareEndDate: '2025-01-07',
	};

	const leadEvents = [ 'submit_lead_form', 'contact' ];

	it( 'uses the breakdown dimensions the dashboard scopes its tabs by', () => {
		expect( STORE_BREAKDOWN_DIMENSION ).toBe(
			'customEvent:googlesitekit_event_provider'
		);
		expect( LEAD_BREAKDOWN_DIMENSION ).toBe(
			'customEvent:googlesitekit_form_id'
		);
	} );

	describe( 'online store', () => {
		it( 'groups both reports by the provider dimension', () => {
			const options = getStoreGroupedReportOptions( dates, 'purchase' );

			expect( options?.eventsReportOptions ).toEqual( {
				...dates,
				dimensions: [ { name: STORE_BREAKDOWN_DIMENSION } ],
				metrics: [ { name: 'eventCount' } ],
				dimensionFilters: { eventName: 'purchase' },
				reportID:
					'analytics-4_site-goals-pdf_storeGroupedEventsReportOptions',
			} );

			expect( options?.engagementReportOptions ).toEqual( {
				...dates,
				dimensions: [ { name: STORE_BREAKDOWN_DIMENSION } ],
				metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
				reportID:
					'analytics-4_site-goals-pdf_storeGroupedEngagementReportOptions',
			} );
		} );

		it( 'builds aggregated reports with no breakdown dimension', () => {
			const options = getStoreAggregatedReportOptions(
				dates,
				'purchase'
			);

			expect( options?.eventsReportOptions ).not.toHaveProperty(
				'dimensions'
			);
			expect( options?.engagementReportOptions ).not.toHaveProperty(
				'dimensions'
			);
			expect( options?.eventsReportOptions.dimensionFilters ).toEqual( {
				eventName: 'purchase',
			} );
		} );

		it( 'builds no reports without a primary event', () => {
			expect(
				getStoreGroupedReportOptions( dates, undefined )
			).toBeNull();
			expect(
				getStoreAggregatedReportOptions( dates, undefined )
			).toBeNull();
		} );
	} );

	describe( 'lead generation', () => {
		it( 'groups both reports by the form dimension', () => {
			const options = getLeadGroupedReportOptions( dates, leadEvents );

			expect( options?.eventsReportOptions ).toEqual( {
				...dates,
				dimensions: [ { name: LEAD_BREAKDOWN_DIMENSION } ],
				metrics: [ { name: 'eventCount' } ],
				dimensionFilters: {
					eventName: {
						filterType: 'inListFilter',
						value: leadEvents,
					},
				},
				reportID:
					'analytics-4_site-goals-pdf_leadGroupedEventsReportOptions',
			} );

			expect( options?.engagementReportOptions.dimensions ).toEqual( [
				{ name: LEAD_BREAKDOWN_DIMENSION },
			] );
		} );

		it( 'builds aggregated reports with no breakdown dimension', () => {
			const options = getLeadAggregatedReportOptions( dates, leadEvents );

			expect( options?.eventsReportOptions ).not.toHaveProperty(
				'dimensions'
			);
			expect( options?.engagementReportOptions ).not.toHaveProperty(
				'dimensions'
			);
		} );

		it( 'builds no reports without detected lead events', () => {
			expect( getLeadGroupedReportOptions( dates, [] ) ).toBeNull();
			expect(
				getLeadAggregatedReportOptions( dates, undefined )
			).toBeNull();
		} );
	} );

	it( 'never scopes the engagement report to the goal events', () => {
		// Filtering engagement by `eventName` would count only the sessions
		// that already converted, pushing every rate to ~100%.
		[
			getStoreGroupedReportOptions( dates, 'purchase' ),
			getStoreAggregatedReportOptions( dates, 'purchase' ),
			getLeadGroupedReportOptions( dates, leadEvents ),
			getLeadAggregatedReportOptions( dates, leadEvents ),
		].forEach( ( options ) => {
			expect( options?.engagementReportOptions ).not.toHaveProperty(
				'dimensionFilters'
			);
		} );
	} );

	it( 'always requests the compare range so trends can be derived', () => {
		[
			getStoreGroupedReportOptions( dates, 'purchase' ),
			getStoreAggregatedReportOptions( dates, 'purchase' ),
			getLeadGroupedReportOptions( dates, leadEvents ),
			getLeadAggregatedReportOptions( dates, leadEvents ),
		].forEach( ( options ) => {
			expect( options?.eventsReportOptions ).toMatchObject( {
				compareStartDate: dates.compareStartDate,
				compareEndDate: dates.compareEndDate,
			} );
			expect( options?.engagementReportOptions ).toMatchObject( {
				compareStartDate: dates.compareStartDate,
				compareEndDate: dates.compareEndDate,
			} );
		} );
	} );
} );

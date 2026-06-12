/**
 * Site Goals breakdown hook tests.
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
import { act } from '@testing-library/react-hooks';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { SITE_GOALS_BREAKDOWN_OTHER_SOURCES_TAB_ID } from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { getPreviousDate } from '@/js/util';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import { useSiteGoalsBreakdown } from './useSiteGoalsBreakdown';

describe( 'useSiteGoalsBreakdown', () => {
	let registry: WPDataRegistry;

	const FORM_DIMENSION = 'customEvent:googlesitekit_form_id';

	// The fixed 90-day discovery window the tab structure is evaluated over.
	function getDiscoveryDates() {
		const endDate = registry.select( CORE_USER ).getReferenceDate();

		return { startDate: getPreviousDate( endDate, 90 ), endDate };
	}

	function seedDiscoveryReport( values: string[] ) {
		const options = {
			...getDiscoveryDates(),
			dimensions: [ FORM_DIMENSION ],
			dimensionFilters: {
				[ FORM_DIMENSION ]: {
					filterType: 'emptyFilter',
					notExpression: true,
				},
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [ { metric: { metricName: 'eventCount' }, desc: true } ],
			reportID:
				'analytics-4_site-goals-breakdown_values_googlesitekit_form_id',
		};

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: values.map( ( value ) => ( {
					dimensionValues: [ { value } ],
					metricValues: [ { value: '1' } ],
				} ) ),
			},
			{ options }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );
	}

	// Seeds the "Other sources" totals reports for both windows: the fixed
	// discovery window (decides whether the tab exists) and the current compare
	// range (its displayed count). otherSourcesCount = allCount − attributedCount.
	function seedOtherSourcesReport(
		eventNames: string[],
		tabValues: string[],
		allCount: number,
		attributedCount: number
	) {
		const eventNameFilter = {
			eventName: { filterType: 'inListFilter', value: eventNames },
		};

		function buildOptions( dates: Record< string, string >, kind: string ) {
			return {
				...dates,
				metrics: [ { name: 'eventCount' } ],
				dimensionFilters: {
					...eventNameFilter,
					...( 'attributed' === kind
						? {
								[ FORM_DIMENSION ]: {
									filterType: 'inListFilter',
									value: tabValues,
								},
						  }
						: {} ),
				},
				reportID: `analytics-4_site-goals-breakdown_other-sources-${ kind }_googlesitekit_form_id`,
			};
		}

		function seed( options: Record< string, unknown >, report: unknown ) {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( report, { options } );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ options ] );
		}

		// Existence over the discovery window (single-range totals).
		const discoveryDates = getDiscoveryDates();
		seed( buildOptions( discoveryDates, 'all' ), {
			totals: [ { metricValues: [ { value: String( allCount ) } ] } ],
		} );
		seed( buildOptions( discoveryDates, 'attributed' ), {
			totals: [
				{ metricValues: [ { value: String( attributedCount ) } ] },
			],
		} );

		// Displayed count over the current compare range.
		const compareDates = registry
			.select( CORE_USER )
			.getDateRangeDates( { compare: true } );

		function compareTotals( count: number ) {
			return {
				totals: [
					{
						dimensionValues: [ { value: 'date_range_0' } ],
						metricValues: [ { value: String( count ) } ],
					},
					{
						dimensionValues: [ { value: 'date_range_1' } ],
						metricValues: [ { value: '0' } ],
					},
				],
			};
		}

		seed( buildOptions( compareDates, 'all' ), compareTotals( allCount ) );
		seed(
			buildOptions( compareDates, 'attributed' ),
			compareTotals( attributedCount )
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	it( 'defaults the active tab to the first breakdown value', () => {
		seedDiscoveryReport( [ '5', '12' ] );

		const { result } = renderHook(
			() => useSiteGoalsBreakdown( GOAL_TYPES.LEAD ),
			{ registry }
		);

		expect( result.current.activeTabID ).toBe( '5' );
		expect( result.current.breakdownFilter ).toEqual( {
			[ FORM_DIMENSION ]: '5',
		} );
	} );

	it( 'exposes the unattributed count and no section filter for the Other sources tab', () => {
		seedDiscoveryReport( [ '5' ] );
		// 25 total events − 20 attributed to form "5" = 5 unattributed.
		seedOtherSourcesReport( [ 'generate_lead' ], [ '5' ], 25, 20 );

		const { result } = renderHook(
			() =>
				useSiteGoalsBreakdown( GOAL_TYPES.LEAD, {
					detectionEventNames: [ 'generate_lead' ],
				} ),
			{ registry }
		);

		expect( result.current.hasOtherSources ).toBe( true );
		expect( result.current.otherSourcesCount ).toBe( 5 );

		act( () => {
			result.current.setSelectedTab(
				SITE_GOALS_BREAKDOWN_OTHER_SOURCES_TAB_ID
			);
		} );

		expect( result.current.isOtherSourcesTab ).toBe( true );
		// The Other sources tab drives its single metric from the count, so it
		// produces no section filter.
		expect( result.current.breakdownFilter ).toBeUndefined();
	} );

	it( 'reports no Other sources tab when all events are attributed', () => {
		seedDiscoveryReport( [ '5' ] );
		// All events are attributed (20 total − 20 attributed = 0 unattributed).
		seedOtherSourcesReport( [ 'generate_lead' ], [ '5' ], 20, 20 );

		const { result } = renderHook(
			() =>
				useSiteGoalsBreakdown( GOAL_TYPES.LEAD, {
					detectionEventNames: [ 'generate_lead' ],
				} ),
			{ registry }
		);

		expect( result.current.hasOtherSources ).toBe( false );
		expect( result.current.activeTabID ).toBe( '5' );
	} );

	it( 'keeps the tabs and selection when the dashboard date range changes', () => {
		seedDiscoveryReport( [ '5', '12' ] );

		const { result, rerender } = renderHook(
			() => useSiteGoalsBreakdown( GOAL_TYPES.LEAD ),
			{ registry }
		);

		act( () => {
			result.current.setSelectedTab( '12' );
		} );
		expect( result.current.activeTabID ).toBe( '12' );

		// The tab structure is evaluated over a fixed discovery window, so a
		// dashboard date range change leaves the tabs and selection untouched —
		// only the metrics follow the new range.
		act( () => {
			registry.dispatch( CORE_USER ).setDateRange( 'last-7-days' );
		} );
		rerender();

		expect( result.current.breakdownValues ).toEqual( [ '5', '12' ] );
		expect( result.current.activeTabID ).toBe( '12' );
		expect( result.current.breakdownFilter ).toEqual( {
			[ FORM_DIMENSION ]: '12',
		} );
	} );
} );

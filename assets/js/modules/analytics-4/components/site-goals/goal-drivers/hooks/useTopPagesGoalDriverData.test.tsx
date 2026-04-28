/**
 * UseTopPagesGoalDriverData hook tests.
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
import { renderHook } from '../../../../../../../../tests/js/test-utils';
import { createTestRegistry } from '../../../../../../../../tests/js/utils';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useTopPagesGoalDriverData from './useTopPagesGoalDriverData';

describe( 'useTopPagesGoalDriverData', () => {
	it( 'falls back to page path when title is unavailable', async () => {
		const registry = createTestRegistry();

		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-04-10' );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );
		const reportOptions = {
			...dates,
			dimensions: [ 'pagePath', 'eventName' ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ 'contact' ],
				},
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [ { metric: { metricName: 'eventCount' }, desc: true } ],
			limit: 6,
			keepEmptyRows: false,
			reportID: 'analytics-4_site-goals_top-pages_lead',
		};
		const pageTitlesReportOptions = {
			...dates,
			dimensionFilters: {
				pagePath: [ '/first-page', '/second-page' ].sort(),
			},
			dimensions: [ 'pagePath', 'pageTitle' ],
			metrics: [ { name: 'screenPageViews' } ],
			orderby: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit: 10,
			reportID: 'analytics-4_get-page-titles_store:selector_options',
		};

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				dimensionHeaders: [
					{ name: 'pagePath' },
					{ name: 'eventName' },
				],
				rows: [
					{
						dimensionValues: [
							{ value: '/first-page' },
							{ value: 'contact' },
						],
						metricValues: [ { value: '22' } ],
					},
					{
						dimensionValues: [
							{ value: '/second-page' },
							{ value: 'contact' },
						],
						metricValues: [ { value: '10' } ],
					},
				],
			},
			{
				options: reportOptions,
			}
		);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [
							{ value: '/first-page' },
							{ value: 'First page title' },
						],
					},
				],
			},
			{
				options: pageTitlesReportOptions,
			}
		);

		const { result, waitForRegistry } = renderHook(
			() =>
				useTopPagesGoalDriverData( {
					goalType: 'lead',
					primaryEvent: [ 'contact' ],
				} ),
			{ registry }
		);

		await waitForRegistry();

		const rows = result.current.rows || [];

		expect( rows ).toHaveLength( 2 );
		expect( rows[ 0 ].label ).toBe( 'First page title' );
		expect( rows[ 1 ].label ).toBe( '/second-page' );
	} );

	it( 'keeps duplicate titles as separate rows and preserves page paths', async () => {
		const registry = createTestRegistry();

		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-04-10' );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );
		const reportOptions = {
			...dates,
			dimensions: [ 'pagePath', 'eventName' ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ 'purchase' ],
				},
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [ { metric: { metricName: 'eventCount' }, desc: true } ],
			limit: 6,
			keepEmptyRows: false,
			reportID: 'analytics-4_site-goals_top-pages_ecommerce',
		};
		const pageTitlesReportOptions = {
			...dates,
			dimensionFilters: {
				pagePath: [ '/order-1', '/order-2' ].sort(),
			},
			dimensions: [ 'pagePath', 'pageTitle' ],
			metrics: [ { name: 'screenPageViews' } ],
			orderby: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit: 10,
			reportID: 'analytics-4_get-page-titles_store:selector_options',
		};

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				dimensionHeaders: [
					{ name: 'pagePath' },
					{ name: 'eventName' },
				],
				rows: [
					{
						dimensionValues: [
							{ value: '/order-1' },
							{ value: 'purchase' },
						],
						metricValues: [ { value: '1' } ],
					},
					{
						dimensionValues: [
							{ value: '/order-2' },
							{ value: 'purchase' },
						],
						metricValues: [ { value: '1' } ],
					},
				],
			},
			{
				options: reportOptions,
			}
		);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [
							{ value: '/order-1' },
							{ value: 'Order received' },
						],
					},
					{
						dimensionValues: [
							{ value: '/order-2' },
							{ value: 'Order received' },
						],
					},
				],
			},
			{
				options: pageTitlesReportOptions,
			}
		);

		const { result, waitForRegistry } = renderHook(
			() =>
				useTopPagesGoalDriverData( {
					goalType: 'ecommerce',
					primaryEvent: [ 'purchase' ],
				} ),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.rows ).toEqual( [
			{
				label: 'Order received',
				value: '1',
				pagePath: '/order-1',
			},
			{
				label: 'Order received',
				value: '1',
				pagePath: '/order-2',
			},
		] );
	} );
} );

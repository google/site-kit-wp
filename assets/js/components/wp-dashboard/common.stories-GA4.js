/**
 * Shared exports among WPDashboard Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { getAnalytics4MockResponse } from '../../modules/analytics-4/utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../.storybook/utils/zeroReports';

const wpDashboardAnalyticsOptionSets = [
	// Mock options for mocking isGatheringData selector's response.
	{
		dimensions: [ 'date' ],
		metrics: [ { name: 'totalUsers' } ],
		startDate: '2020-12-31',
		endDate: '2021-01-27',
	},

	// Mock options for mocking "Total Users" report's response.
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		compareStartDate: '2020-12-03',
		compareEndDate: '2020-12-30',
		metrics: [
			{
				name: 'totalUsers',
			},
		],
	},
];

export const setupAnalyticsMockReports = (
	registry,
	mockOptions = wpDashboardAnalyticsOptionSets
) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
	mockOptions.forEach( ( options ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( getAnalytics4MockResponse( options ), {
				options,
			} );
	} );
};

export const setupAnalyticsGatheringData = (
	registry,
	mockOptions = wpDashboardAnalyticsOptionSets
) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
	mockOptions.forEach( ( options ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			[
				{
					data: {
						rows: [],
						totals: [ { values: [] }, { values: [] } ],
					},
				},
			],
			{
				options,
			}
		);
	} );
};

export function setupAnalyticsZeroData(
	registry,
	mockOptionSets = wpDashboardAnalyticsOptionSets
) {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

	mockOptionSets.forEach( ( options ) => {
		const report = getAnalytics4MockResponse( options );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options,
		} );
	} );
}

/**
 * AdSense data requirements.
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
import { WPDataRegistry } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ADSENSE } from '@/js/modules/adsense/datastore/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { isZeroReport } from '@/js/modules/analytics-4/utils';

/**
 * Returns a function that checks if the ad blocking recovery setup status matches the given status.
 *
 * @since n.e.x.t
 *
 * @param {string} status Ad blocking recovery setup status to match.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the ad blocking recovery setup status matches or not.
 */
export function requireAdBlockingRecoverySetupStatus( status ) {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_ADSENSE ).getSettings();

		return (
			status ===
			select( MODULES_ADSENSE ).getAdBlockingRecoverySetupStatus()
		);
	};
}

/**
 * Returns a function that checks if the linked Analytics property has revenue for the connected AdSense account.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the linked Analytics property has AdSense revenue or not.
 */
export function requireAdSenseRevenueInAnalytics() {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_ADSENSE ).getSettings();

		const adSenseAccountID = select( MODULES_ADSENSE ).getAccountID();
		const { startDate, endDate } = select( CORE_USER ).getDateRangeDates();

		const reportData = await resolveSelect( MODULES_ANALYTICS_4 ).getReport(
			{
				startDate,
				endDate,
				dimensions: [ 'pagePath', 'adSourceName' ],
				metrics: [ { name: 'totalAdRevenue' } ],
				dimensionFilters: {
					adSourceName: `Google AdSense account (${ adSenseAccountID })`,
				},
				orderby: [
					{
						metric: { metricName: 'totalAdRevenue' },
						desc: true,
					},
				],
				limit: 1,
				reportID:
					'notifications_analytics-adsense-linked-overlay_reportArgs',
			}
		);

		return false === isZeroReport( reportData );
	};
}

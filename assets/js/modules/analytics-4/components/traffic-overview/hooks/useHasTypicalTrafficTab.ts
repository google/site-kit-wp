/**
 * Traffic Overview `useHasTypicalTrafficTab` hook.
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
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
} from '@/js/hooks/useDashboardType';
import { useFeature } from '@/js/hooks/useFeature';
import { getTypicalTrafficEligibilityDate } from '@/js/modules/analytics-4/components/traffic-overview/utils/getTypicalTrafficEligibilityDate';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { getPropertyCreateDate } from '@/js/modules/analytics-4/utils/property-create-date';

/**
 * Checks whether the Traffic Overview widget shows the Typical Traffic tab.
 *
 * The tab needs the `typicalTraffic` feature, the main dashboard, a connected
 * Analytics module, and an Analytics property created at least thirteen months
 * before the reference date. While the list of modules or the creation time
 * loads, the hook returns `false`, so the tab appears once rather than
 * appearing and then disappearing.
 *
 * @since 1.190.0
 *
 * @return {boolean} `true` when the widget shows the Typical Traffic tab, otherwise `false`.
 */
export function useHasTypicalTrafficTab(): boolean {
	const typicalTrafficEnabled = useFeature( 'typicalTraffic' );
	const isMainDashboard = useDashboardType() === DASHBOARD_TYPE_MAIN;

	return useSelect(
		( select: Select ) => {
			if (
				! typicalTrafficEnabled ||
				! isMainDashboard ||
				! select( CORE_MODULES ).isModuleConnected(
					MODULE_SLUG_ANALYTICS_4
				)
			) {
				return false;
			}

			const propertyCreateDate = getPropertyCreateDate(
				select( MODULES_ANALYTICS_4 ).getPropertyCreateTime()
			);

			if ( ! propertyCreateDate ) {
				return false;
			}

			return (
				propertyCreateDate <=
				getTypicalTrafficEligibilityDate(
					select( CORE_USER ).getReferenceDate()
				)
			);
		},
		[ typicalTrafficEnabled, isMainDashboard ]
	);
}

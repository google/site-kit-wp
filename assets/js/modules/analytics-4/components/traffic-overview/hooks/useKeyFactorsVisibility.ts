/**
 * Traffic Overview `useKeyFactorsVisibility` hook.
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
import { Select, useInViewSelect } from 'googlesitekit-data';
import useCanViewSharedModule from '@/js/hooks/useCanViewSharedModule';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
} from '@/js/hooks/useDashboardType';
import { useFeature } from '@/js/hooks/useFeature';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

export interface KeyFactorsVisibility {
	/**
	 * Whether the Traffic overview tab has the key factors: the `typicalTraffic`
	 * feature is on and the widget is on the main dashboard.
	 */
	isAvailable: boolean;
	/** Whether the Traffic overview panel shows the key factors. */
	isShown: boolean;
}

/**
 * Checks whether the Traffic overview tab has the key factors, and whether its
 * panel shows them.
 *
 * The key factors describe the whole site, so the entity dashboard, which
 * shows one page, leaves them out. A property that is still gathering data has
 * none to show, so the panel shows their placeholders until that is known, and
 * then leaves them out.
 *
 * @since n.e.x.t
 *
 * @return {KeyFactorsVisibility} Whether the tab has the key factors, and whether its panel shows them.
 */
export function useKeyFactorsVisibility(): KeyFactorsVisibility {
	const typicalTrafficEnabled = useFeature( 'typicalTraffic' );
	const isMainDashboard = useDashboardType() === DASHBOARD_TYPE_MAIN;

	const canViewSharedAnalytics4 = useCanViewSharedModule(
		MODULE_SLUG_ANALYTICS_4
	);

	const isAvailable = typicalTrafficEnabled && isMainDashboard;

	const isGatheringData = useInViewSelect< boolean | undefined >(
		( select: Select ) =>
			isAvailable && canViewSharedAnalytics4
				? select( MODULES_ANALYTICS_4 ).isGatheringData()
				: undefined,
		[ isAvailable, canViewSharedAnalytics4 ]
	);

	return {
		isAvailable,
		isShown: isAvailable && ! isGatheringData,
	};
}

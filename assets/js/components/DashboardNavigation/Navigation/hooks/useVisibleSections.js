/**
 * `useVisibleSections` hook.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../../../../googlesitekit/widgets/datastore/constants';
import {
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
	CONTEXT_ENTITY_DASHBOARD_TRAFFIC,
	CONTEXT_ENTITY_DASHBOARD_CONTENT,
	CONTEXT_ENTITY_DASHBOARD_SPEED,
	CONTEXT_ENTITY_DASHBOARD_MONETIZATION,
} from '../../../../googlesitekit/widgets/default-contexts';
import {
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_TRAFFIC,
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_MONETIZATION,
} from '../../../../googlesitekit/constants';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
} from '../../../../hooks/useDashboardType';
import useViewOnly from '../../../../hooks/useViewOnly';

export default function useVisibleSections() {
	const dashboardType = useDashboardType();
	const viewOnlyDashboard = useViewOnly();

	const viewableModules = useSelect( ( select ) =>
		viewOnlyDashboard ? select( CORE_USER ).getViewableModules() : null
	);

	const widgetContextOptions = {
		modules: viewableModules || undefined,
	};

	const isKeyMetricsWidgetHidden = useSelect( ( select ) =>
		select( CORE_USER ).isKeyMetricsWidgetHidden()
	);

	const showKeyMetrics = useSelect( ( select ) =>
		dashboardType === DASHBOARD_TYPE_MAIN && ! isKeyMetricsWidgetHidden
			? select( CORE_WIDGETS ).isWidgetContextActive(
					CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
					widgetContextOptions
			  )
			: false
	);

	const showTraffic = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_TRAFFIC
				: CONTEXT_ENTITY_DASHBOARD_TRAFFIC,
			widgetContextOptions
		)
	);

	const showContent = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_CONTENT
				: CONTEXT_ENTITY_DASHBOARD_CONTENT,
			widgetContextOptions
		)
	);

	const showSpeed = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_SPEED
				: CONTEXT_ENTITY_DASHBOARD_SPEED,
			widgetContextOptions
		)
	);

	const showMonetization = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_MONETIZATION
				: CONTEXT_ENTITY_DASHBOARD_MONETIZATION,
			widgetContextOptions
		)
	);

	const visibleSections = [
		...( showKeyMetrics ? [ ANCHOR_ID_KEY_METRICS ] : [] ),
		...( showTraffic ? [ ANCHOR_ID_TRAFFIC ] : [] ),
		...( showContent ? [ ANCHOR_ID_CONTENT ] : [] ),
		...( showSpeed ? [ ANCHOR_ID_SPEED ] : [] ),
		...( showMonetization ? [ ANCHOR_ID_MONETIZATION ] : [] ),
	];

	return {
		showKeyMetrics,
		showTraffic,
		showContent,
		showSpeed,
		showMonetization,
		visibleSections,
	};
}

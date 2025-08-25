/**
 * Navigation `useVisibleSections` hook.
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
import {
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_TRAFFIC,
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_MONETIZATION,
} from '../../../../googlesitekit/constants';
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
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../../../../googlesitekit/widgets/datastore/constants';
import useDashboardType, {
	DASHBOARD_TYPE_ENTITY,
	DASHBOARD_TYPE_MAIN,
} from '../../../../hooks/useDashboardType';
import useViewOnly from '../../../../hooks/useViewOnly';

export const contexts = {
	[ DASHBOARD_TYPE_MAIN ]: {
		[ ANCHOR_ID_KEY_METRICS ]: CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
		[ ANCHOR_ID_TRAFFIC ]: CONTEXT_MAIN_DASHBOARD_TRAFFIC,
		[ ANCHOR_ID_CONTENT ]: CONTEXT_MAIN_DASHBOARD_CONTENT,
		[ ANCHOR_ID_SPEED ]: CONTEXT_MAIN_DASHBOARD_SPEED,
		[ ANCHOR_ID_MONETIZATION ]: CONTEXT_MAIN_DASHBOARD_MONETIZATION,
	},
	[ DASHBOARD_TYPE_ENTITY ]: {
		[ ANCHOR_ID_TRAFFIC ]: CONTEXT_ENTITY_DASHBOARD_TRAFFIC,
		[ ANCHOR_ID_CONTENT ]: CONTEXT_ENTITY_DASHBOARD_CONTENT,
		[ ANCHOR_ID_SPEED ]: CONTEXT_ENTITY_DASHBOARD_SPEED,
		[ ANCHOR_ID_MONETIZATION ]: CONTEXT_ENTITY_DASHBOARD_MONETIZATION,
	},
};

/**
 * Returns the visible sections for the dashboard navigation.
 *
 * @since 1.159.0
 *
 * @return {Array<string>} The visible sections.
 */
export default function useVisibleSections() {
	const dashboardType = useDashboardType();
	const viewOnlyDashboard = useViewOnly();

	return useSelect( ( select ) => {
		const viewableModules = viewOnlyDashboard
			? select( CORE_USER ).getViewableModules()
			: null;

		const isKeyMetricsWidgetHidden =
			select( CORE_USER ).isKeyMetricsWidgetHidden();

		const widgetContextOptions = {
			modules: viewableModules ? viewableModules : undefined,
		};

		return Object.keys( contexts[ dashboardType ] ).reduce(
			( visibleSections, section ) => {
				// Skip key metrics section if it's hidden.
				if (
					section === ANCHOR_ID_KEY_METRICS &&
					isKeyMetricsWidgetHidden
				) {
					return visibleSections;
				}

				if (
					select( CORE_WIDGETS ).isWidgetContextActive(
						contexts[ dashboardType ][ section ],
						widgetContextOptions
					)
				) {
					visibleSections.push( section );
				}

				return visibleSections;
			},
			[]
		);
	} );
}

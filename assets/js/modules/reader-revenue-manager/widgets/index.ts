/**
 * Reader Revenue Manager module widget registrations.
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
import { Select } from '@/js/googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { AREA_MAIN_DASHBOARD_TRAFFIC_READER_REVENUE_MANAGER } from '@/js/googlesitekit/widgets/default-areas';
import { ReaderRevenueManagerSetupCTABannerWidget } from '@/js/modules/reader-revenue-manager/components/dashboard';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_EXPRESS_SETUP_TRAFFIC_CTA_DISMISSED_KEY,
	RRM_EXPRESS_SETUP_TRAFFIC_CTA_WIDGET_SLUG,
} from '@/js/modules/reader-revenue-manager/constants';

// @ts-expect-error TODO: Add type for `widgets` when googlesitekit-widgets is migrated to TypeScript.
export function registerWidgets( widgets ) {
	widgets.registerWidget(
		RRM_EXPRESS_SETUP_TRAFFIC_CTA_WIDGET_SLUG,
		{
			Component: ReaderRevenueManagerSetupCTABannerWidget,
			width: [ widgets.WIDGET_WIDTHS.FULL ],
			priority: 1,
			wrapWidget: false,
			isActive: ( select: Select ) => {
				const canActivateModule = select(
					CORE_MODULES
				).canActivateModule( MODULE_SLUG_READER_REVENUE_MANAGER );

				const isModuleConnected = select(
					CORE_MODULES
				).isModuleConnected( MODULE_SLUG_READER_REVENUE_MANAGER );

				const isWidgetDismissed = select( CORE_USER ).isItemDismissed(
					RRM_EXPRESS_SETUP_TRAFFIC_CTA_DISMISSED_KEY
				);

				const isViewOnly = ! select( CORE_USER ).isAuthenticated();

				return (
					! isViewOnly &&
					canActivateModule &&
					isModuleConnected === false &&
					isPromptDismissed === false
				);
			},
		},
		[ AREA_MAIN_DASHBOARD_TRAFFIC_READER_REVENUE_MANAGER ]
	);
}

/**
 * `useWelcomeTour` hook.
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
import { useSelect, type Select } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	CORE_USER,
	PERMISSION_AUTHENTICATE,
} from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { NOTIFICATION_GROUPS } from '@/js/googlesitekit/notifications/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import useViewContext from '@/js/hooks/useViewContext';
import useViewOnly from '@/js/hooks/useViewOnly';
import { getWelcomeTour } from '@/js/feature-tours/welcome';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

/**
 * Returns the welcome tour configuration based on the current user context.
 *
 * @since 1.175.0
 *
 * @return The welcome tour configuration object.
 */
export function useWelcomeTour() {
	const isViewOnly = useViewOnly();
	const viewContext = useViewContext();

	const canAuthenticate = useSelect(
		( select: Select ) =>
			select( CORE_USER ).hasCapability( PERMISSION_AUTHENTICATE ),
		[]
	);

	const isAnalyticsConnected = useSelect(
		( select: Select ) =>
			!! select( CORE_MODULES ).isModuleConnected(
				MODULE_SLUG_ANALYTICS_4
			),
		[]
	);

	const isActivateAnalyticsNotificationPresent = useSelect(
		( select: Select ) => {
			if ( viewContext !== VIEW_CONTEXT_MAIN_DASHBOARD ) {
				return false;
			}

			const queuedNotifications = select(
				CORE_NOTIFICATIONS
			).getQueuedNotifications(
				VIEW_CONTEXT_MAIN_DASHBOARD,
				NOTIFICATION_GROUPS.DEFAULT
			);

			return (
				queuedNotifications?.[ 0 ]?.id ===
				'activate-analytics-notification'
			);
		},
		[ viewContext ]
	);

	const isKeyMetricsWidgetPresent = useSelect(
		( select: Select ) =>
			isAnalyticsConnected &&
			!! select( CORE_SITE ).isKeyMetricsSetupCompleted() &&
			! select( CORE_USER ).isKeyMetricsWidgetHidden(),
		[ isAnalyticsConnected ]
	);

	const isAudienceSegmentationWidgetPresent = useSelect(
		( select: Select ) =>
			isAnalyticsConnected &&
			!! select(
				MODULES_ANALYTICS_4
			).isAudienceSegmentationSetupCompleted() &&
			! select( CORE_USER ).isAudienceSegmentationWidgetHidden(),
		[ isAnalyticsConnected ]
	);

	return getWelcomeTour( {
		isViewOnly,
		canAuthenticate,
		isAnalyticsConnected,
		isActivateAnalyticsNotificationPresent,
		isKeyMetricsWidgetPresent,
		isAudienceSegmentationWidgetPresent,
	} );
}

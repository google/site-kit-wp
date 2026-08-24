/**
 * Setup CTA visibility helper.
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
import { Registry, Select } from 'googlesitekit-data';
import { isFeatureEnabled } from '@/js/features';
import {
	CORE_USER,
	INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG,
} from '@/js/googlesitekit/datastore/user/constants';
import {
	ACTIVATE_ANALYTICS_NOTIFICATION,
	CONNECT_MORE_SERVICES_NOTIFICATION,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';

/**
 * Determines whether the setup CTAs and feature introduction overlays should be hidden.
 *
 * They stay hidden on the first dashboard landing so they don't stack on top of the
 * setup notifications that are already competing for the user's attention there.
 *
 * @since n.e.x.t
 *
 * @param {Function} select      Data store select function.
 * @param {string}   viewContext Current view context.
 * @return {boolean} True when the setup CTAs should be hidden, false otherwise.
 */
export function shouldHideSetupCTAs(
	select: Select,
	viewContext: string
): boolean {
	if ( ! isFeatureEnabled( 'setupFlowRefresh' ) ) {
		return false;
	}

	const initialSetupNotificationTimeoutDismissed = select(
		CORE_USER
	).isItemDismissed( INITIAL_SETUP_NOTIFICATION_TIMEOUT_SLUG );
	const queuedHeaderNotifications = select(
		CORE_NOTIFICATIONS
	).getQueuedNotifications( viewContext, NOTIFICATION_GROUPS.DEFAULT );
	const firstHeaderNotificationID =
		queuedHeaderNotifications?.[ 0 ]?.id || null;

	return (
		initialSetupNotificationTimeoutDismissed ||
		firstHeaderNotificationID === ACTIVATE_ANALYTICS_NOTIFICATION ||
		firstHeaderNotificationID === CONNECT_MORE_SERVICES_NOTIFICATION
	);
}

/**
 * Returns a function that checks the setup CTAs are not hidden.
 *
 * @since n.e.x.t
 *
 * @return {Function} Whether the setup CTAs are shown or not.
 */
export function requireSetupCTAsNotHidden() {
	return async (
		{ select, resolveSelect }: Registry,
		viewContext: string
	): Promise< boolean > => {
		// Both selectors `shouldHideSetupCTAs()` reads report `undefined` until
		// they resolve, which would otherwise read as "nothing to hide" and let
		// the overlay through on the very load it is meant to stay off.
		await Promise.all( [
			resolveSelect( CORE_USER ).getDismissedItems(),
			resolveSelect( CORE_NOTIFICATIONS ).getQueuedNotifications(
				viewContext,
				NOTIFICATION_GROUPS.DEFAULT
			),
		] );

		return ! shouldHideSetupCTAs( select as Select, viewContext );
	};
}

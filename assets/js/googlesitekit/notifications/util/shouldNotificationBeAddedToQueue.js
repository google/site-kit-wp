/**
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
import { isFeatureEnabled } from '@/js/features';

/**
 * Checks if a notification should be added to the queue based on
 * its feature flags, groupID, viewContext, etc.
 *
 * @since 1.155.0
 *
 * @param {Object}  notification                Notification object.
 * @param {Object}  params                      Parameters.
 * @param {string}  params.groupID              Group ID to check against the notification's groupID.
 * @param {boolean} params.isDismissed          Whether the notification is already dismissed, if it's dismissible.
 * @param {string}  params.viewContext          View context to check against the notification's viewContexts (if present).
 * @param {Array}   params._enabledFeatureFlags Feature flags object to check against the notification's `featureFlag`. Used for testing purposes.
 * @return {boolean} Returns true if the notification should be added to the queue, false otherwise.
 */
export function shouldNotificationBeAddedToQueue(
	notification,
	{ groupID, viewContext, isDismissed, _enabledFeatureFlags } = {}
) {
	if (
		notification?.featureFlag &&
		! isFeatureEnabled(
			notification.featureFlag,
			_enabledFeatureFlags ? new Set( _enabledFeatureFlags ) : undefined
		)
	) {
		return false;
	}

	if ( notification.groupID !== groupID ) {
		return false;
	}

	if (
		notification.viewContexts?.length &&
		viewContext &&
		! notification.viewContexts.includes( viewContext )
	) {
		return false;
	}

	if ( notification.isDismissible && isDismissed ) {
		return false;
	}

	return true;
}

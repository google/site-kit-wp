/**
 * Mark notification
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import API from 'googlesitekit-api';

const ACCEPTED = 'accepted';
const DISMISSED = 'dismissed';

/**
 * Marks the given notification with the provided state.
 *
 * @since 1.4.0
 *
 * @param {string} id    Notification ID.
 * @param {string} state Notification state.
 * @return {Promise} Promise from setting the notification.
 */
export async function markNotification( id, state ) {
	// Invalidate the cache so that notifications will be fetched fresh
	// to not show a marked notification again.
	await API.invalidateCache( 'core', 'site', 'notifications' );

	return await API.set( 'core', 'site', 'mark-notification', {
		notificationID: id,
		notificationState: state,
	} );
}

/**
 * Marks the given notification as accepted.
 *
 * @since 1.4.0
 *
 * @param {string} id Notification ID.
 * @return {Promise} Promise that is fulfilled after the notification is marked as accepted.
 */
export async function acceptNotification( id ) {
	return await markNotification( id, ACCEPTED );
}

/**
 * Marks the given notification as dismissed.
 *
 * @since 1.4.0
 *
 * @param {string} id Notification ID.
 * @return {Promise} Promise that is fulfilled after the notification is marked as dismissed.
 */
export async function dismissNotification( id ) {
	return await markNotification( id, DISMISSED );
}

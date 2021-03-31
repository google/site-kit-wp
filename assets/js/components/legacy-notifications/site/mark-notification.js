/**
 * Internal dependencies
 */
import data, { TYPE_CORE } from '../../data';
import { trackEvent } from '../../../util/tracking';

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
	data.invalidateCacheGroup( TYPE_CORE, 'site', 'notifications' );

	await trackEvent( 'site_notifications', state, id );

	return await data.set( TYPE_CORE, 'site', 'mark-notification', {
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

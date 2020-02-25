
/**
 * External dependencies
 */
import data, { TYPE_CORE } from 'GoogleComponents/data';

const ACCEPTED = 'accepted';
const DISMISSED = 'dismissed';

/**
 * Marks the given notification with the provided state.
 *
 * @param {string} id   Notification ID.
 * @param {state} state Notification state.
 */
export async function markNotification( id, state ) {
	return await data.set( TYPE_CORE, 'site', 'mark-notification', {
		notificationID: id,
		notificationState: state,
	} );
}

/**
 * Marks the given notification as accepted.
 *
 * @param {string} id Notification ID.
 */
export async function acceptNotification( id ) {
	return await markNotification( id, ACCEPTED );
}

/**
 * Marks the given notification as dismissed.
 *
 * @param {string} id Notification ID.
 */
export async function dismissNotification( id ) {
	return await markNotification( id, DISMISSED );
}

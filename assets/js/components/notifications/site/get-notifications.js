/**
 * External dependencies
 */
import data, { TYPE_CORE } from 'GoogleComponents/data';

/**
 * Gets core site notifications.
 * Leverages data cache.
 *
 * @return {Array} List of notification objects.
 */
export default async function getNotifications() {
	return await data.get( TYPE_CORE, 'site', 'notifications', {}, false );
}

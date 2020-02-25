/**
 * External dependencies
 */
import { TYPE_CORE, get } from 'GoogleComponents/data';

/**
 * Gets core site notifications.
 * Leverages data cache.
 *
 * @return {Array} List of notification objects.
 */
export default async function getNotifications() {
	return await get( TYPE_CORE, 'site', 'notifications', {}, false );
}

/**
 * Notification utility functions.
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
 * External dependencies
 */
import memize from 'memize';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { getItem } from '../../googlesitekit/api/cache';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';

export const wincallbacks = applyFilters( 'googlesitekit.winCallbacks', {} );

export const modulesNotificationsToRequest = () => {
	return [ 'adsense' ];
};

/**
 * Retrieves the total number of notifications from session storage.
 *
 * Otherwise make the requests to get modules notifications.
 *
 * @since 1.0.0
 *
 * @return {number} Total number of notifications.
 */
export async function getTotalNotifications() {
	const { setup } = global._googlesitekitLegacyData;

	if (
		! setup.isSiteKitConnected ||
		( ! setup.isAuthenticated && ! setup.isVerified )
	) {
		return 0;
	}

	let total = 0;

	const modulesResponse = await getModulesNotifications();
	if ( modulesResponse && modulesResponse.total ) {
		total = total + modulesResponse.total;
	}

	total = Math.max( 0, Math.abs( total ) );

	// The total notifications count should always rely on local storage
	// directly for external availability.
	if ( global.localStorage ) {
		global.localStorage.setItem(
			'googlesitekit::total-notifications',
			total
		);
	}

	return total;
}

/**
 * Removes dismissed notifications from list.
 *
 * @since 1.0.0
 *
 * @param {Array} notifications List of notifications.
 * @return {Array} Filtered list of notifications.
 */
const removeDismissed = async ( notifications ) => {
	if ( ! notifications ) {
		return [];
	}

	if ( ! notifications.length ) {
		return notifications;
	}

	const promises = notifications.map( ( notification ) =>
		getItem( `notification::dismissed::${ notification.id }` )
	);
	const notificationDismissals = await Promise.all( promises );

	return notifications.filter( ( _, index ) => {
		const dismissed = notificationDismissals[ index ].cacheHit;
		return ! dismissed;
	} );
};

/**
 * Gets notifications from session storage, fallback to notifications API request.
 *
 * @since 1.0.0
 * @since 1.41.0 Memoized to prevent duplicate simultaneous fetch requests from different callers.
 *
 * @return {Promise} Object with `results` (map [slug]: notificationObject[]) and `total` (int).
 */
export const getModulesNotifications = memize( async () => {
	const results = {};
	let total = 0;

	// Legacy hack: we need to use the global datastore instance here.
	await Data.resolveSelect( CORE_MODULES ).getModules();
	const { isModuleActive } = Data.select( CORE_MODULES );

	const activeModuleSlugs = modulesNotificationsToRequest().filter(
		( slug ) => isModuleActive( slug )
	);

	const promises = activeModuleSlugs.map( ( identifier ) => {
		return new Promise( async ( resolve ) => {
			const notifications = await removeDismissed(
				await API.get( 'modules', identifier, 'notifications' )
			);
			results[ identifier ] = notifications;
			total += notifications.length;
			resolve();
		} );
	} );
	await Promise.all( promises );

	return { results, total };
} );

export const incrementCount = ( state ) => {
	const value = Math.abs( state.count ) + 1;
	// The total notifications count should always rely on local storage
	// directly for external availability.
	if ( global.localStorage ) {
		global.localStorage.setItem(
			'googlesitekit::total-notifications',
			value
		);
	}
	return {
		count: value,
	};
};

export const decrementCount = ( state ) => {
	const value = Math.max( 0, Math.abs( state.count ) - 1 );
	// The total notifications count should always rely on local storage
	// directly for external availability.
	if ( global.localStorage ) {
		global.localStorage.setItem(
			'googlesitekit::total-notifications',
			value
		);
	}
	return {
		count: value,
	};
};

/**
 * Notification utility functions.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import data, { TYPE_MODULES } from '../data';
import { getCache } from '../data/cache';
export const wincallbacks = applyFilters( 'googlesitekit.winCallbacks', {} );

export const modulesNotificationsToRequest = () => {
	return applyFilters( 'googlesitekit.ModulesNotificationsRequest', [] );
};

/**
 * Retrieves the total number of notifications from session storage.
 *
 * Otherwise make the requests to get modules and page wins notifications.
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

	total = applyFilters( 'googlesitekit.TotalNotifications', total );
	total = Math.max( 0, Math.abs( total ) );

	// The total notifications count should always rely on local storage
	// directly for external availability.
	if ( global.localStorage ) {
		global.localStorage.setItem( 'googlesitekit::total-notifications', total );
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
const removeDismissed = ( notifications ) => {
	if ( ! notifications ) {
		return [];
	}

	if ( ! notifications.length ) {
		return notifications;
	}

	return notifications.filter( ( notification ) => {
		const dismissed = getCache( `notification::dismissed::${ notification.id }` );
		return ! dismissed;
	} );
};

/**
 * Gets notifications from session storage, fallback to notifications API request.
 *
 * @since 1.0.0
 *
 * @return {number} Number of module notifications.
 */
export async function getModulesNotifications() {
	const results = {};
	let total = 0;

	const modules = await modulesNotificationsToRequest();
	const promises = [];

	modules.map( async ( module ) => {
		const promise = new Promise( async ( resolve ) => {
			const { identifier } = module;

			const notifications = removeDismissed(
				await data.get( TYPE_MODULES, identifier, 'notifications', {}, false )
			);

			resolve( { identifier, notifications } );
		} );

		promises.push( promise );
	} );

	await Promise.all( promises ).then( ( res ) => {
		res.forEach( ( r ) => {
			if ( r.notifications.length ) {
				total = total + r.notifications.length;
				results[ r.identifier ] = r.notifications;
			}
		} );
	} );

	return { results, total };
}

export const incrementCount = ( state ) => {
	const value = Math.abs( state.count ) + 1;
	// The total notifications count should always rely on local storage
	// directly for external availability.
	if ( global.localStorage ) {
		global.localStorage.setItem( 'googlesitekit::total-notifications', value );
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
		global.localStorage.setItem( 'googlesitekit::total-notifications', value );
	}
	return {
		count: value,
	};
};

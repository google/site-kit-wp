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

import data from 'GoogleComponents/data';
import { getTimeInSeconds } from 'GoogleUtil';
import WinsWithData from './wins-withdata';
import { getDaysBetweenDates } from 'GoogleUtil';

const { applyFilters } = wp.hooks;
const { camelCase } = lodash;

export const wincallbacks = applyFilters( 'googlesitekit.winCallbacks', {} );

export const winsNotificationsToRequest = () => {
	return applyFilters( 'googlesitekit.WinsNotificationsRequest', [] );
};

export const modulesNotificationsToRequest = () => {
	return applyFilters( 'googlesitekit.ModulesNotificationsRequest', [] );
};

/**
 * Retrieve total number of notifications from session storage
 * otherwise make the requests to get modules and page wins notifications.
 */
export async function getTotalNotifications() {

	const { setup } = window.googlesitekit;

	if ( ! setup.isSiteKitConnected || ! setup.isAuthenticated && ! setup.isVerified ) {
		return 0;
	}

	let total = 0;

	const modulesResponse = await getModulesNotifications();
	if ( modulesResponse && modulesResponse.total ) {
		total = total + modulesResponse.total;
	}

	const winsResponse = await getWinsNotifications();
	if ( winsResponse && winsResponse.total ) {
		total = total + winsResponse.total;
	}

	total = applyFilters( 'googlesitekit.TotalNotifications', total );
	total = Math.max( 0, Math.abs( total ) );

	// Set in locale storage for external reference.
	localStorage.setItem( 'googlesitekit::total-notifications', total );

	return total;
}

/**
 * Removes dismissed notifications from list.
 *
 * @param {array} notifications
 */
const removeDismissed = ( notifications ) => {
	if ( ! notifications.length ) {
		return notifications;
	}

	return notifications.filter( ( notification ) => {
		const dismissed = data.getCache( `notification::dismissed::${notification.id}` );
		return ! dismissed;
	} );
};

/**
 * Remove displayed wins set to show once.
 * We display 1 win at a time so we have sometihng new for the user each time.
 *
 * @param {array} notifications
 */
const removeDisplayedWins = ( wins ) => {
	const firstWin = ( items ) =>  Object.keys( items ).slice( 0, 1 ).map( i => {
		return items[ i ];
	} );

	if ( 1 >= Object.keys( wins ).length ) {
		return wins;
	}

	// Get only the wins that haven't been displayed yet.
	const notDisplayed =  Object.values( wins ).filter(  win => {
		const displayed = sessionStorage.getItem( `notification::displayed::${win[0].id}` );

		if ( displayed ) {
			const displayedDate = new Date( displayed );
			const now = new Date();
			const today = new Date( Date.UTC( now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() ) );
			displayedDate.setHours( 0, 0, 0 );
			today.setHours( 0, 0, 0 );

			// Return the win if it has displayed today.
			if ( displayedDate.getTime() === today.getTime() ) {
				return true;
			}

			// Remove the displayed storage if it has been displayed a week ago.
			const days = getDaysBetweenDates( displayedDate, today );
			if ( 7 <= days ) {
				sessionStorage.removeItem( `notification::displayed::${win[0].id}` );
			}
		}

		return null === displayed;
	} );

	let first = null;
	let result = [];

	// Return 1st value if we have more than 1 win to show.
	if ( 0 < Object.keys( notDisplayed ).length ) {
		first = firstWin( notDisplayed );
		return result[ Object.keys( notDisplayed )[0] ] = first;
	}

	// At least return 1st value if all have been displayed before.
	first = firstWin( wins );
	return result[ Object.keys( wins )[0] ] = first;
};

/**
 * Get notifications from session storage, fallback to notifications api request.
 */
export async function getModulesNotifications() {
	const results = {};
	const cta = {};
	let total = 0;

	const modules = await modulesNotificationsToRequest();
	const promises = [];

	modules.map( async( module ) => {
		const promise = new Promise( async( resolve ) => {
			const { identifier } =  module;
			let notifications = [];

			const response = await data.getNotifications( identifier, getTimeInSeconds( 'day' ) );

			if ( response ) {
				notifications = response.items || [];
				cta.url = response.url || '';
				cta.label = response.ctaLabel || '';
				cta.target = response.ctaTarget || '';

				// Remove dismissed ones.
				notifications = removeDismissed( notifications );
			}

			resolve( { identifier, notifications } );
		} );

		promises.push( promise );
	} );

	await Promise.all( promises ).then( ( res ) => {
		res.map( ( r ) => {
			if ( r.notifications.length ) {
				total = total + r.notifications.length;
				results[ r.identifier ] = r.notifications;
			}
		} );
	} );

	return { results, total, cta };
}

/**
 * Get win notifications, fallback to callback declared function.
 */
export async function getWinsNotifications() {
	let results = {};
	let total = 0;

	const wins = await winsNotificationsToRequest();
	const winsWithData = await new WinsWithData( wins ).get();
	const promises = [];

	wins.map( async( win ) => {

		const promise = new Promise( async( resolve ) => {
			const { identifier } =  win;
			const callback = win.callback || camelCase( identifier );
			let notificationData = null;
			let notifications = [];

			if ( win.withData ) {
				const moduleData = winsWithData[ identifier ] || null;
				notificationData = wincallbacks[ callback ]( moduleData, identifier );
			} else {
				notificationData = wincallbacks[ callback ]( identifier );
			}

			if ( ! notificationData ) {
				notifications = [];
			} else {
				notifications = [ notificationData ];
			}

			// Remove dismissed ones.
			notifications = removeDismissed( notifications );

			resolve( { identifier, notifications } );
		} );

		promises.push( promise );
	} );

	await Promise.all( promises ).then( ( res ) => {
		res.map( ( r ) => {
			if ( r.notifications.length ) {
				results[ r.identifier ] = r.notifications;
			}
		} );
	} );

	results = removeDisplayedWins( results );
	total = results.length || Object.keys( results ).length || 0;

	return { results, total };
}

export const incrementCount = ( state ) => {
	const value = Math.abs( state.count ) + 1;
	localStorage.setItem( 'googlesitekit::total-notifications', value );
	return {
		count: value
	};
};

export const decrementCount = ( state ) => {
	const value = Math.max( 0, Math.abs( state.count ) - 1 );
	localStorage.setItem( 'googlesitekit::total-notifications', value );
	return {
		count: value
	};
};

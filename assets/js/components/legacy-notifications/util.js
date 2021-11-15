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
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

export const wincallbacks = applyFilters( 'googlesitekit.winCallbacks', {} );

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

	// Will always return 0 until a new notification system is in place.
	const total = 0;

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

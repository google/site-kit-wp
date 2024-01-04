/**
 * `useMonitorInternetConnection` hook.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useLifecycles, useInterval } from 'react-use';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../googlesitekit/datastore/ui/constants';

const { useDispatch, useSelect } = Data;

/**
 * Monitors the user's internet connection status.
 *
 * @since n.e.x.t
 *
 * @param {Array|null} intervalValues           Optional. Custom values for interval.
 * @param {number}     intervalValues.isOnline  Interval when user is online.
 * @param {number}     intervalValues.isOffline Interval when user is offline.
 */
export function useMonitorInternetConnection( intervalValues = null ) {
	const { setValue } = useDispatch( CORE_UI );

	const isOnline = useSelect( ( select ) => {
		return select( CORE_UI ).getValue( 'isOnline' );
	} );

	const checkInternetConnection = useCallback( async () => {
		if ( ! navigator.onLine ) {
			setValue( 'isOnline', false );
			return;
		}

		try {
			// Use apiFetch directly, instead of our wrapper API, to have
			// control over the error handling/catching, as status is switched to offline
			// if request fails to reach the server.
			const onlineResponse = await apiFetch( {
				method: 'GET',
				path: '/google-site-kit/v1/core/site/data/health-checks',
			} );

			// We are only intersted if the request was successfull, to
			// confirm online status.
			const canReachInternetURL = onlineResponse.checks;

			if ( canReachInternetURL ) {
				setValue( 'isOnline', true );
			}

			if ( ! canReachInternetURL ) {
				setValue( 'isOnline', false );
			}
		} catch ( err ) {
			setValue( 'isOnline', false );
		}
	}, [ setValue ] );

	useLifecycles(
		async () => {
			global.addEventListener( 'online', checkInternetConnection );
			global.addEventListener( 'offline', checkInternetConnection );

			await checkInternetConnection();
		},
		() => {
			global.removeEventListener( 'online', checkInternetConnection );
			global.removeEventListener( 'offline', checkInternetConnection );
		}
	);

	let intervalTime = isOnline ? 120000 : 15000;
	if ( intervalValues ) {
		intervalTime = isOnline
			? intervalValues.isOnline
			: intervalValues.isOffline;
	}

	useInterval( async () => {
		await checkInternetConnection();
	}, intervalTime );
}

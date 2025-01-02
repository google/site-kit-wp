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
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_UI } from '../googlesitekit/datastore/ui/constants';

/**
 * Monitors the user's internet connection status.
 *
 * @since 1.118.0
 * @since 1.136.0 Changed the connection check endpoint.
 */
export function useMonitorInternetConnection() {
	const { setIsOnline } = useDispatch( CORE_UI );

	const isOnline = useSelect( ( select ) => {
		return select( CORE_UI ).getIsOnline();
	} );

	const checkInternetConnection = useCallback( async () => {
		if ( ! navigator.onLine ) {
			setIsOnline( false );
			return;
		}

		try {
			const connectionCheckResponse = await apiFetch( {
				path: '/google-site-kit/v1/',
			} );

			// We are only interested if the request was successful, to
			// confirm online status.
			const canReachConnectionCheck = !! connectionCheckResponse;

			setIsOnline( canReachConnectionCheck );
		} catch ( err ) {
			if ( err?.code === 'fetch_error' ) {
				setIsOnline( false );
				return;
			}

			setIsOnline( true );
		}
	}, [ setIsOnline ] );

	useLifecycles(
		() => {
			global.addEventListener( 'online', checkInternetConnection );
			global.addEventListener( 'offline', checkInternetConnection );
		},
		() => {
			global.removeEventListener( 'online', checkInternetConnection );
			global.removeEventListener( 'offline', checkInternetConnection );
		}
	);

	useInterval( checkInternetConnection, isOnline ? 120000 : 15000 );
}

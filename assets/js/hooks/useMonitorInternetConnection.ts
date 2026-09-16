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
import { useEvent, useInterval } from 'react-use';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Select,
	UseSelect,
	useDispatch,
	useSelect as useSelectWithRequiredDeps,
} from 'googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';

// This selector deliberately omits `deps`. See the `UseSelect` type.
const useSelect = useSelectWithRequiredDeps as UseSelect;

/**
 * Monitors the user's internet connection status.
 *
 * @since 1.118.0
 * @since 1.136.0 Changed the connection check endpoint.
 *
 * @return {void}
 */
export function useMonitorInternetConnection(): void {
	const { setIsOnline } = useDispatch( CORE_UI );

	const isOnline = useSelect( ( select: Select ) => {
		return select( CORE_UI ).getIsOnline();
	} );

	const checkInternetConnection = useCallback( async () => {
		if ( ! navigator.onLine ) {
			setIsOnline( false );
			return;
		}

		try {
			await apiFetch( { path: '/google-site-kit/v1/' } );
		} catch ( err ) {
			if ( err?.code === 'fetch_error' ) {
				setIsOnline( false );
				return;
			}
		}
		// If the request succeeded or failed for any other reason,
		// we should still be online.
		setIsOnline( true );
	}, [ setIsOnline ] );

	useEvent( 'online', checkInternetConnection );
	useEvent( 'offline', checkInternetConnection );

	useInterval( checkInternetConnection, isOnline ? 120000 : 15000 );
}

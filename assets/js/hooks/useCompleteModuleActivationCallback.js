/**
 * `useCompleteModuleActivationCallback` hook.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '../googlesitekit/datastore/location/constants';

/**
 * Returns a callback to navigate users to the module's authentication URL.
 *
 * Returns null if the module doesn't exist or the user can't manage options.
 *
 * @since 1.73.0
 *
 * @param {string} moduleSlug Module slug.
 * @return {Function|null} Callback that navigates to a module's reauth URL, null if the module doesn't exist or the user can't manage options.
 */
export default function useCompleteModuleActivationCallback( moduleSlug ) {
	const canManageOptions = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS )
	);
	const moduleStoreName = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleStoreName( moduleSlug )
	);
	const adminReauthURL = useSelect( ( select ) =>
		select( moduleStoreName )?.getAdminReauthURL()
	);
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const completeModuleActivationCallback = useCallback(
		() => navigateTo( adminReauthURL ),
		[ adminReauthURL, navigateTo ]
	);

	if ( ! adminReauthURL || ! canManageOptions ) {
		return null;
	}

	return completeModuleActivationCallback;
}

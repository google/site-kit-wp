/**
 * `useActivateModuleCallback` hook.
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
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '../googlesitekit/datastore/location/constants';
import { trackEvent } from '../util/tracking';
import useViewContext from './useViewContext';

/**
 * Returns a callback to activate a module. If the call to activate the module is successful, navigate to the reauthentication URL.
 * Returns null if the module doesn't exist or the user can't manage options.
 *
 * @since 1.70.0
 *
 * @param {string} moduleSlug Module slug.
 * @return {Function|null} Callback to activate module, null if the module doesn't exist or the user can't manage options.
 */
export default function useActivateModuleCallback( moduleSlug ) {
	const viewContext = useViewContext();
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);
	const canManageOptions = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS )
	);

	const { activateModule } = useDispatch( CORE_MODULES );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { setInternalServerError } = useDispatch( CORE_SITE );

	const activateModuleCallback = useCallback( async () => {
		const { error, response } = await activateModule( moduleSlug );

		if ( ! error ) {
			await trackEvent(
				`${ viewContext }_widget-activation-cta`,
				'activate_module',
				moduleSlug
			);

			navigateTo( response.moduleReauthURL );
		} else {
			setInternalServerError( {
				id: `${ moduleSlug }-setup-error`,
				description: error.message,
			} );
		}
	}, [
		activateModule,
		moduleSlug,
		navigateTo,
		setInternalServerError,
		viewContext,
	] );

	if ( ! module?.name || ! canManageOptions ) {
		return null;
	}

	return activateModuleCallback;
}

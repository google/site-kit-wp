/**
 * Analytics 4 `useConversionTrackingSetting` hook.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';

export interface ConversionTrackingSetting {
	/** Whether the user may read and change the setting. */
	canManageOptions: boolean | undefined;
	/**
	 * Whether plugin conversion tracking is on. It reads `undefined` while the
	 * setting loads, and for a user who is not allowed to read it.
	 */
	isConversionTrackingEnabled: boolean | undefined;
}

/**
 * Reads the plugin conversion tracking setting, for a user allowed to read it.
 *
 * The REST route behind the setting requires `MANAGE_OPTIONS`, so asking for it
 * without the capability only logs a 403.
 *
 * @since n.e.x.t
 *
 * @return The capability, and the setting for a user who holds it.
 */
export function useConversionTrackingSetting(): ConversionTrackingSetting {
	const canManageOptions = useSelect(
		( select: Select ) =>
			select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS ),
		[]
	);

	const isConversionTrackingEnabled = useSelect(
		( select: Select ) =>
			canManageOptions
				? select( CORE_SITE ).isConversionTrackingEnabled()
				: undefined,
		[ canManageOptions ]
	);

	return { canManageOptions, isConversionTrackingEnabled };
}

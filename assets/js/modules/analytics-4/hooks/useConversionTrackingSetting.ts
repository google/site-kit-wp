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
	/** Whether the user may change the setting. */
	canManageOptions: boolean | undefined;
	/** Whether plugin conversion tracking is on. It reads `undefined` while the setting loads. */
	isConversionTrackingEnabled: boolean | undefined;
}

/**
 * Reads the plugin conversion tracking setting, and whether the user may change it.
 *
 * Any user who can view the dashboard may read the setting, while only a user
 * who can manage options may change it.
 *
 * @since 1.189.0
 * @since n.e.x.t Read the setting for every user, not only for a user who can manage options.
 *
 * @return {ConversionTrackingSetting} The setting, and whether the user may change it.
 */
export function useConversionTrackingSetting(): ConversionTrackingSetting {
	const canManageOptions = useSelect(
		( select: Select ) =>
			select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS ),
		[]
	);

	const isConversionTrackingEnabled = useSelect(
		( select: Select ) => select( CORE_SITE ).isConversionTrackingEnabled(),
		[]
	);

	return { canManageOptions, isConversionTrackingEnabled };
}

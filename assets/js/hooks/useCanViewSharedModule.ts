/**
 * `useCanViewSharedModule` hook.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useViewOnly from './useViewOnly';

/**
 * Determines whether the current user can view the data of a module.
 *
 * Outside a view-only dashboard, the user can view the data of every module.
 *
 * @since n.e.x.t
 *
 * @param {string} moduleSlug The module slug.
 * @return {(boolean|undefined)} Whether the user can view the module's data, or `undefined` while the user's capabilities load.
 */
export default function useCanViewSharedModule(
	moduleSlug: string
): boolean | undefined {
	const viewOnly = useViewOnly();

	return useSelect(
		( select: Select ) =>
			! viewOnly || select( CORE_USER ).canViewSharedModule( moduleSlug ),
		[ viewOnly, moduleSlug ]
	);
}

/**
 * Select when not in view only context.
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
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useViewOnly from './useViewOnly';

/**
 * Returns null if the current dashboard context is view only.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Function} mapSelect Selector to call when this selector's component is considered in-view.
 * @param {Array}    deps      Deps passed to `useSelectIfNotViewOnly`'s `deps` argument.
 * @return {*} `null` if the dashboard context is view only; otherwise the result of the selector.
 */
export const useSelectIfNotViewOnly = ( mapSelect, deps = [] ) => {
	const isViewOnly = useViewOnly();

	const mapSelectCallback = useCallback( mapSelect, [ ...deps, mapSelect ] );

	return useSelect(
		isViewOnly
			? () => {
					return null;
			  }
			: mapSelectCallback
	);
};

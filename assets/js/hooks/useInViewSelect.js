/**
 * Select when in-view hook.
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { useInView } from './useInView';
const { useSelect } = Data;

/**
 * Returns whether the nearest parent component tracking viewport detection is in-view.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Function} mapSelect Selector to call when this selector's component is considered in-view.
 * @param {Array}    deps      Deps passed to `useSelect`'s `deps` argument.
 * @return {*} The result of the selector if in-view; `undefined` if not in-view.
 */
export const useInViewSelect = ( mapSelect, deps = [] ) => {
	const isInView = useInView( { sticky: true } );

	const mapSelectCallback = useCallback( mapSelect, [ ...deps, mapSelect ] );

	const selectorResult = useSelect(
		isInView
			? mapSelectCallback
			: () => {
					return undefined;
			  }
	);

	return selectorResult;
};

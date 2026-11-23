/**
 * `useHideTooltip` hook.
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';

/**
 * Returns a callback that hides the admin screen tooltip.
 *
 * @since n.e.x.t
 *
 * @return {Function} Callback that hides the tooltip.
 */
export function useHideTooltip() {
	const { setValue } = useDispatch( CORE_UI );

	return useCallback( () => {
		setValue( 'admin-screen-tooltip', undefined );
	}, [ setValue ] );
}

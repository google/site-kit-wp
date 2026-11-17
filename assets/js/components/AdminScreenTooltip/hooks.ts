/**
 * Tooltip settings hook.
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
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { TooltipSettings } from './types';

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

/**
 * Returns a callback that shows the admin screen tooltip.
 *
 * @since 1.163.0
 *
 * @param {Object} tooltipSettings Tooltip settings, passed to `AdminScreenTooltip`.
 * @return {Function} Callback that shows the tooltip.
 */
export function useShowTooltip( tooltipSettings: TooltipSettings ) {
	const { setValue } = useDispatch( CORE_UI );

	return useCallback( () => {
		setValue( 'admin-screen-tooltip', {
			isTooltipVisible: true,
			...tooltipSettings,
		} );
	}, [ setValue, tooltipSettings ] );
}

/**
 * Returns the admin screen tooltip settings.
 *
 * @since n.e.x.t
 *
 * @return {Object} Tooltip settings.
 */
export function useTooltipSettings(): TooltipSettings {
	return useSelect(
		( select: Select ) =>
			select( CORE_UI ).getValue( 'admin-screen-tooltip' ) || {
				isTooltipVisible: false,
			},
		[]
	);
}

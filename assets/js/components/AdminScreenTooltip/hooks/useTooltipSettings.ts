/**
 * `useTooltipSettings` hook.
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
import { TooltipSettings } from '@/js/components/AdminScreenTooltip/types';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';

const DEFAULT_TOOLTIP_SETTINGS = {
	isTooltipVisible: false,
};

/**
 * Returns the admin screen tooltip settings.
 *
 * @since n.e.x.t
 *
 * @return {Object} Tooltip settings.
 */
export function useTooltipSettings(): Partial< TooltipSettings > {
	return useSelect(
		( select: Select ) =>
			select( CORE_UI ).getValue( 'admin-screen-tooltip' ) ||
			DEFAULT_TOOLTIP_SETTINGS,
		[]
	);
}

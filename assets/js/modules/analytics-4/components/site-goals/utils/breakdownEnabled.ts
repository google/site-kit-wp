/**
 * Site Goals breakdown enabled state.
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
import type { ConversionTrackingSetting } from '@/js/modules/analytics-4/hooks/useConversionTrackingSetting';

/**
 * Determines whether the Site Goals breakdown is enabled.
 *
 * The breakdown needs its custom dimensions on the property and plugin
 * conversion tracking switched on, since Site Kit has to track the events
 * itself to attach those dimensions. The dimensions may have been created by
 * another custom dimensions CTA, which leaves conversion tracking alone.
 *
 * Only a user allowed to read the conversion tracking setting is held to it;
 * anyone else falls back to the dimensions alone, as the setting never loads
 * for them. This matches how `BreakdownNoticeArea` waits for the setting.
 *
 * @since n.e.x.t
 *
 * @param {boolean|undefined} hasBreakdownDimensions                         Whether the breakdown custom dimensions exist, or `undefined` while loading.
 * @param {Object}            conversionTracking                             The conversion tracking setting, see `useConversionTrackingSetting`.
 * @param {boolean|undefined} conversionTracking.canManageOptions            Whether the user may read and change the setting.
 * @param {boolean|undefined} conversionTracking.isConversionTrackingEnabled Whether plugin conversion tracking is on.
 * @return {boolean|undefined} Whether the breakdown is enabled, or `undefined` while either condition is loading.
 */
export function isSiteGoalsBreakdownEnabled(
	hasBreakdownDimensions: boolean | undefined,
	{ canManageOptions, isConversionTrackingEnabled }: ConversionTrackingSetting
): boolean | undefined {
	if ( hasBreakdownDimensions === undefined ) {
		return undefined;
	}

	// Without the dimensions there is nothing to wait for.
	if ( ! hasBreakdownDimensions ) {
		return false;
	}

	if ( ! canManageOptions ) {
		return true;
	}

	return isConversionTrackingEnabled;
}

/**
 * Site Goals `useIsSiteGoalsBreakdownEnabled` hook.
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
import { isSiteGoalsBreakdownEnabled } from '@/js/modules/analytics-4/components/site-goals/utils/breakdownEnabled';
import { useConversionTrackingSetting } from '@/js/modules/analytics-4/hooks/useConversionTrackingSetting';

/**
 * Reads whether the Site Goals breakdown is enabled, pairing the breakdown
 * dimensions with the plugin conversion tracking setting.
 *
 * @since n.e.x.t
 *
 * @param {boolean|undefined} hasBreakdownDimensions Whether the breakdown custom dimensions exist, or `undefined` while loading.
 * @return {boolean|undefined} Whether the breakdown is enabled, or `undefined` while either condition is loading.
 */
export function useIsSiteGoalsBreakdownEnabled(
	hasBreakdownDimensions: boolean | undefined
): boolean | undefined {
	const conversionTracking = useConversionTrackingSetting();

	return isSiteGoalsBreakdownEnabled(
		hasBreakdownDimensions,
		conversionTracking
	);
}

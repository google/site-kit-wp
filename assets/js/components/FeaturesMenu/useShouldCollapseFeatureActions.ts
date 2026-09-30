/**
 * `useShouldCollapseFeatureActions` hook.
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
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import { useFeature } from '@/js/hooks/useFeature';
import useViewOnly from '@/js/hooks/useViewOnly';
import { useWindowWidth } from '@/js/hooks/useWindowSize';

/**
 * Determines whether the header feature action icons should collapse into the
 * single three-dots features menu.
 *
 * They always collapse on mobile and tablet. When the "Add features" button is
 * shown it widens the header actions, so they also collapse at or below the
 * given window width.
 *
 * @since n.e.x.t
 *
 * @param collapseWidth Window width in pixels at or below which the actions collapse when the "Add features" button is shown.
 * @return `true` if the header feature actions should collapse, otherwise `false`.
 */
export default function useShouldCollapseFeatureActions(
	collapseWidth: number
): boolean {
	const breakpoint = useBreakpoint();
	const windowWidth = useWindowWidth();
	const featureDiscoveryHubEnabled = useFeature( 'featureDiscoveryHub' );
	const viewOnlyDashboard = useViewOnly();

	if ( breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET ) {
		return true;
	}

	const isAddFeaturesButtonVisible =
		featureDiscoveryHubEnabled && ! viewOnlyDashboard;

	return isAddFeaturesButtonVisible && windowWidth <= collapseWidth;
}

/**
 * Traffic Overview `useTrackPostLinkClick` hook.
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
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import { useRecordRecentActivityInteraction } from './useRecordRecentActivityInteraction';

/** The section of the Recent activity tab that a post link is in. */
type RecentActivityPostLinkSection = 'latest-post-header' | 'top-posts';

/**
 * Gets a handler for a click on a post link in the Recent activity tab.
 *
 * The handler sends the `click_post_link` event, labeled with the link's
 * section, and records a meaningful interaction with the tab.
 *
 * @since 1.192.0
 *
 * @param {string} section The section the link is in.
 * @return {Function} A handler that returns a promise, which resolves once the event is sent and the interaction is saved.
 */
export function useTrackPostLinkClick(
	section: RecentActivityPostLinkSection
): () => Promise< void > {
	const viewContext = useViewContext();
	const recordInteraction = useRecordRecentActivityInteraction();

	return useCallback( async () => {
		await Promise.all( [
			trackEvent(
				`${ viewContext }_recent-activity`,
				'click_post_link',
				section
			),
			recordInteraction(),
		] );
	}, [ recordInteraction, section, viewContext ] );
}

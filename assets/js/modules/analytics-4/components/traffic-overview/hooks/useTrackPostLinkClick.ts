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

export type RecentActivityPostLinkSection = 'latest-post-header' | 'top-posts';

/**
 * Returns a callback that tracks a click on a post link of the Recent activity
 * tab, as a `click_post_link` event labelled with the link's section.
 *
 * @since n.e.x.t
 *
 * @param {string} section The section the link sits in.
 * @return {Function} The callback that tracks the click.
 */
export function useTrackPostLinkClick(
	section: RecentActivityPostLinkSection
): () => void {
	const viewContext = useViewContext();

	return useCallback( () => {
		trackEvent(
			`${ viewContext }_recent-activity`,
			'click_post_link',
			section
		);
	}, [ section, viewContext ] );
}

/**
 * `useTrackSourceLinkClickCallback` hook.
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
import useWidget from '@/js/googlesitekit/widgets/hooks/useWidget';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';

/**
 * Returns a callback that tracks a `click_source_link` event for the widget
 * the source link renders in.
 *
 * The callback tracks nothing outside a widget, or with no view context.
 *
 * @since n.e.x.t
 *
 * @return {Function} The callback that tracks the click.
 */
export default function useTrackSourceLinkClickCallback(): () => void {
	const viewContext = useViewContext();
	const widget = useWidget();

	return useCallback( () => {
		if ( ! widget.slug || ! viewContext ) {
			return;
		}

		trackEvent(
			`${ viewContext }_widget`,
			'click_source_link',
			widget.slug
		);
	}, [ viewContext, widget ] );
}

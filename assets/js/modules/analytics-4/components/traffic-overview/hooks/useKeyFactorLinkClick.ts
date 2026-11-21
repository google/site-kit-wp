/**
 * Traffic Overview `useKeyFactorLinkClick` hook.
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
 * External dependencies
 */
import { MouseEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import useViewContext from '@/js/hooks/useViewContext';
import { BenchmarkingKeyFactorKind } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { trackEvent } from '@/js/util';

export type KeyFactorLinkClickHandler = (
	event: MouseEvent< HTMLAnchorElement | HTMLButtonElement >,
	href: string
) => Promise< void >;

/**
 * Returns a click handler for the page links of a key factor card: the title
 * of a post's card and a landing page row.
 *
 * The handler records the click, labelled with the card's kind, before it
 * leaves the page for the link's dashboard.
 *
 * @since n.e.x.t
 *
 * @param {string} cardKind The kind of the card the links are on, such as `CONTENT`.
 * @return {Function} The click handler, which takes the click event and the link's URL.
 */
export function useKeyFactorLinkClick(
	cardKind: BenchmarkingKeyFactorKind
): KeyFactorLinkClickHandler {
	const viewContext = useViewContext();
	const { navigateTo } = useDispatch( CORE_LOCATION );

	return useCallback(
		async ( event, href ) => {
			function track() {
				return trackEvent(
					`${ viewContext }_typical-traffic`,
					'click_page_link',
					cardKind
				);
			}

			// A Command or Control click opens the link in a new tab or window,
			// so this page stays open to save the click, and the browser
			// handles the click.
			if ( event.metaKey || event.ctrlKey ) {
				track();
				return;
			}

			// The default must be prevented before the `await`, or the browser
			// leaves the page before the click is saved.
			event.preventDefault();

			await track();

			navigateTo( href );
		},
		[ cardKind, navigateTo, viewContext ]
	);
}

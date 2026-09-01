/**
 * Link click engagement event tracking.
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
import classifyContactLink from './classify-contact-link';

/**
 * Initializes link click tracking.
 *
 * Adds one click listener to the document. It finds the clicked anchor,
 * classifies it, and emits at most one event, so a contact link that also has
 * `rel="nofollow"` is not counted twice.
 *
 * Listening on the document also covers links added after the page loads, such
 * as a floating chat button.
 *
 * @since n.e.x.t
 *
 * @return {void}
 */
export function initializeLinkClicks(): void {
	global.document.addEventListener( 'click', ( event: Event ) => {
		// One failed click must not stop the listener handling later ones.
		try {
			if ( ! ( event.target instanceof Element ) ) {
				return;
			}

			const anchor = event.target.closest(
				'a[href]'
			) as HTMLAnchorElement | null;

			if ( ! anchor ) {
				return;
			}

			const linkType = classifyContactLink( anchor );

			// Contact links stop here. Their URL holds someone's phone number
			// or email address, so they must never reach the outbound handler.
			if ( linkType ) {
				const isWebLink =
					'http:' === anchor.protocol || 'https:' === anchor.protocol;

				global._googlesitekit?.gtagEvent?.( 'contact_link_click', {
					link_type: linkType,
					// Clicking a web link leaves the page, which would cancel
					// the event mid-send. `beacon` gets it out anyway. `tel:`
					// and the other app schemes stay on the page.
					...( isWebLink ? { transport_type: 'beacon' } : {} ),
				} );
			} else {
				// `outbound_link_click` (#13291) handles the anchor here.
			}
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error(
				'Site Kit: failed to track this link click.',
				error
			);
		}
	} );
}

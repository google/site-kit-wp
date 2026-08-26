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
 * The single delegated listener every link event shares: it resolves the
 * clicked anchor once, classifies it once, and emits at most one event, so a
 * contact link that also carries `rel="nofollow"` is never reported twice.
 *
 * Registered unconditionally, with no container or page-type gate, so a link
 * added after load — a floating chat button, for instance — is covered too.
 *
 * @since n.e.x.t
 *
 * @return {void}
 */
export function initializeLinkClicks(): void {
	global.document.addEventListener( 'click', ( event: Event ) => {
		// An error while handling one click must not leave the listener in a
		// state that stops it handling the next one.
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

			// An `else` rather than an early return: the recipient sits in the
			// address itself, so a classified anchor must never reach a handler
			// that reports the URL — not even when emitting its own event
			// throws and the `catch` below resumes past this point.
			if ( linkType ) {
				const isWebLink =
					'http:' === anchor.protocol || 'https:' === anchor.protocol;

				global._googlesitekit?.gtagEvent?.( 'contact_link_click', {
					link_type: linkType,
					// A web link navigates away, so its event has to survive the
					// page unloading. An app-scheme link hands off to another
					// application and leaves the page in place.
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

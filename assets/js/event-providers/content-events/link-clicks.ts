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
import classifyOutboundLink from './classify-outbound-link';

/** The transport a link event is sent with, spread into its payload. */
interface TransportProperties {
	/** Set only when the click navigates away from the page. */
	// eslint-disable-next-line camelcase
	transport_type?: 'beacon';
}

/**
 * Gets the transport properties a link's event is sent with.
 *
 * A web link navigates away, so its event has to survive the page unloading. An
 * app-scheme link hands off to another application and leaves the page in place.
 *
 * @since n.e.x.t
 *
 * @param {URL} url Parsed link address.
 * @return {Object} Transport properties to spread into the event payload.
 */
function getTransportProperties( url: URL ): TransportProperties {
	return 'http:' === url.protocol || 'https:' === url.protocol
		? { transport_type: 'beacon' }
		: {};
}

/**
 * Initializes link click tracking.
 *
 * The single delegated listener every link event shares: it resolves the
 * clicked anchor once, classifies it once, and emits at most one event, so a
 * contact link that also carries `rel="nofollow"` is never reported twice.
 *
 * Registered on the document for every page, so a link added after load — a
 * floating chat button, for instance — is covered too.
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

			let url: URL;

			// Both classifiers read this same address, and a link the parser
			// rejects is not tracked at all.
			try {
				url = new URL( anchor.href );
			} catch {
				return;
			}

			const linkType = classifyContactLink( url );

			// An `else` rather than an early return: the recipient sits in the
			// address itself, so a classified anchor must never reach a handler
			// that reports the URL — not even when emitting its own event
			// throws and the `catch` below resumes past this point.
			if ( linkType ) {
				global._googlesitekit?.gtagEvent?.( 'contact_link_click', {
					link_type: linkType,
					...getTransportProperties( url ),
				} );
			} else {
				const linkRel = classifyOutboundLink( anchor, url );

				if ( linkRel ) {
					global._googlesitekit?.gtagEvent?.( 'outbound_link_click', {
						link_rel: linkRel,
						link_url: url.href,
						link_domain: url.hostname,
						...getTransportProperties( url ),
					} );
				}
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

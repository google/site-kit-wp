/**
 * Contact link classification.
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

/** The `link_type` values this event reports. */
export type ContactLinkType =
	| 'phone'
	| 'email'
	| 'sms'
	| 'whatsapp'
	| 'messenger'
	| 'telegram'
	| 'viber'
	| 'signal'
	| 'line';

/** One contact link kind: how to recognize it, and who counts as a recipient. */
export interface ContactLinkMatcher {
	/** Value reported as the event's `link_type`. */
	type: ContactLinkType;
	/** URL schemes this kind is recognized by, each with its trailing colon. */
	schemes?: string[];
	/** Hosts this kind is recognized by, without a `www.` prefix. */
	hosts?: string[];
	/** Whether the link names someone to contact; omitted when every match does. */
	hasRecipient?: ( url: URL ) => boolean;
}

/**
 * Splits a URL's path into its non-empty segments.
 *
 * @since n.e.x.t
 *
 * @param {URL} url Parsed link address.
 * @return {Array<string>} The path's non-empty segments.
 */
function getPathSegments( url: URL ): string[] {
	return url.pathname.split( '/' ).filter( Boolean );
}

/**
 * Folds a path segment's case for comparison against a fixed keyword.
 *
 * Schemes and hosts are lower-cased before a matcher runs, but the path is left
 * as the author wrote it, and every keyword compared below is a fixed marker rather
 * than a recipient — `share`, `joinchat`, `qr`. Comparing those case-sensitively
 * would let `t.me/Share/…` through as a contact, which is the share link this
 * event exists to keep out.
 *
 * @since n.e.x.t
 *
 * @param {string} segment Path segment; may be undefined.
 * @return {string} The segment in lower case, or an empty string.
 */
function lowerCaseSegment( segment?: string ): string {
	return ( segment || '' ).toLowerCase();
}

/**
 * The contact link kinds this event reports, one row per `link_type`.
 *
 * A row matches on parsed protocol and host, never on a CSS selector or a
 * substring: the `URL` parser lowercases and punycodes both, so matching is an
 * equality check and a look-alike host like `notwa.me` is simply a different
 * site.
 *
 * Every messaging host serves three purposes — message someone, share this
 * page, join a group — and only the first is the visitor contacting the
 * business, so `hasRecipient` keeps share links and group invites out.
 * `chat.whatsapp.com`, `signal.group` and `social-plugins.line.me` exist only
 * for the other two purposes and so appear in no `hosts` list at all.
 *
 * @since n.e.x.t
 */
export const CONTACT_LINK_MATCHERS: ContactLinkMatcher[] = [
	{
		type: 'phone',
		schemes: [ 'tel:' ],
	},
	{
		type: 'email',
		schemes: [ 'mailto:' ],
	},
	{
		type: 'sms',
		schemes: [ 'sms:', 'smsto:' ],
	},
	{
		type: 'whatsapp',
		schemes: [ 'whatsapp:' ],
		hosts: [ 'wa.me', 'api.whatsapp.com', 'web.whatsapp.com' ],
		hasRecipient: ( url ) => {
			if ( 'wa.me' === url.hostname ) {
				const [ first, second ] = getPathSegments( url );

				// A bare number, or one of WhatsApp's short-link forms.
				return (
					/^\d+$/.test( first || '' ) ||
					( [ 'message', 'qr' ].includes(
						lowerCaseSegment( first )
					) &&
						!! second )
				);
			}

			// `api.`/`web.whatsapp.com` and the `whatsapp:` scheme both name the
			// recipient in a `phone` param; without it the link only prefills a
			// message to share.
			return !! url.searchParams.get( 'phone' );
		},
	},
	{
		type: 'messenger',
		schemes: [ 'fb-messenger:' ],
		hosts: [ 'm.me', 'messenger.com' ],
		hasRecipient: ( url ) => {
			if ( 'm.me' === url.hostname ) {
				return getPathSegments( url ).length > 0;
			}

			if ( 'messenger.com' === url.hostname ) {
				const [ first, second ] = getPathSegments( url );

				return 't' === lowerCaseSegment( first ) && !! second;
			}

			// `fb-messenger://user-thread/<id>` and `fb-messenger://user/<id>`;
			// the parser reads the part before the first slash as the hostname.
			return [ 'user-thread', 'user' ].includes( url.hostname );
		},
	},
	{
		type: 'telegram',
		schemes: [ 'tg:' ],
		hosts: [ 't.me', 'telegram.me' ],
		hasRecipient: ( url ) => {
			if ( 'tg:' === url.protocol ) {
				return (
					'resolve' === url.hostname &&
					!! url.searchParams.get( 'domain' )
				);
			}

			const [ first ] = getPathSegments( url );

			// `+<hash>` and `joinchat` are group invites, `share` shares the
			// page, and stickers and proxies open neither a chat nor a channel.
			return (
				!! first &&
				! first.startsWith( '+' ) &&
				! [ 'share', 'joinchat', 'addstickers', 'proxy' ].includes(
					lowerCaseSegment( first )
				)
			);
		},
	},
	{
		type: 'viber',
		schemes: [ 'viber:' ],
		// `viber://forward` shares the page; the three below open a
		// conversation with someone.
		hasRecipient: ( url ) =>
			[ 'chat', 'add', 'pa' ].includes( url.hostname ),
	},
	{
		type: 'signal',
		schemes: [ 'sgnl:' ],
		hosts: [ 'signal.me' ],
		hasRecipient: ( url ) => {
			if ( 'sgnl:' === url.protocol ) {
				return true;
			}

			// Signal names the recipient in the fragment, so a bare
			// `signal.me/` opens nothing in particular.
			return (
				url.hash.startsWith( '#p/' ) && url.hash.length > '#p/'.length
			);
		},
	},
	{
		type: 'line',
		schemes: [ 'line:' ],
		hosts: [ 'line.me', 'page.line.me' ],
		hasRecipient: ( url ) => {
			if ( 'page.line.me' === url.hostname ) {
				return getPathSegments( url ).length > 0;
			}

			// One `ti`/`p`/`<id>` shape for both forms: `line://ti/p/@acme`
			// puts `ti` in the hostname, while `line.me/ti/p/@acme` puts it in
			// the path behind an optional `R`. Anything else under `line.me`,
			// such as `R/msg/text/`, shares rather than contacts.
			const segments =
				'line:' === url.protocol
					? [ url.hostname, ...getPathSegments( url ) ]
					: getPathSegments( url );
			const [ first, second, third, fourth ] =
				'r' === lowerCaseSegment( segments[ 0 ] )
					? segments.slice( 1 )
					: segments;

			return (
				'ti' === lowerCaseSegment( first ) &&
				'p' === lowerCaseSegment( second ) &&
				!! third &&
				! fourth
			);
		},
	},
];

// Both indexes are built from the one table above in a single pass, so a click
// costs two hash lookups rather than a scan.
//
// Prototype-less, because the host key comes straight from the address bar: it is
// lower-cased before the lookup, which rules out `toString` and friends, but
// leaves `constructor` and `__proto__` intact. A plain object would hand those back as
// inherited values, and a lookup that returned a truthy non-matcher would make
// `classifyContactLink` report `undefined` instead of `null`.
const matchersByScheme: Record< string, ContactLinkMatcher > =
	Object.create( null );
const matchersByHost: Record< string, ContactLinkMatcher > =
	Object.create( null );

CONTACT_LINK_MATCHERS.forEach( ( matcher ) => {
	matcher.schemes?.forEach( ( scheme ) => {
		matchersByScheme[ scheme ] = matcher;
	} );
	matcher.hosts?.forEach( ( host ) => {
		matchersByHost[ host ] = matcher;
	} );
} );

/**
 * Classifies a link as one of the contact kinds, or as none of them.
 *
 * @since n.e.x.t
 *
 * @param {URL} linkURL Parsed link address.
 * @return {string|null} The `link_type` to report, or `null` when the link is not a contact link.
 */
export default function classifyContactLink(
	linkURL: URL
): ContactLinkType | null {
	// The normalization below writes to the hostname, and the caller reports the
	// same URL's address, so that write happens on a copy of it.
	const url = new URL( linkURL );

	const isWebLink = 'http:' === url.protocol || 'https:' === url.protocol;

	// Normalized on the URL rather than only for the lookup below, so a matcher's
	// `hasRecipient` sees the same host. The parser lower-cases a web link's host
	// but not an app scheme's, so `viber://CHAT` would otherwise match nothing.
	url.hostname = isWebLink
		? url.hostname.replace( /^www\./, '' )
		: url.hostname.toLowerCase();

	const matcher = isWebLink
		? matchersByHost[ url.hostname ]
		: matchersByScheme[ url.protocol ];

	if ( ! matcher ) {
		return null;
	}

	if ( ! matcher.hasRecipient ) {
		return matcher.type;
	}

	return matcher.hasRecipient( url ) ? matcher.type : null;
}

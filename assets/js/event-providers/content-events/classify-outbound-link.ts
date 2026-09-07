/**
 * Outbound link classification.
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
 * The `rel` qualifications this event reports, in the order `link_rel` lists them.
 *
 * Google's "Qualify your outbound links" guidance defines these three, and a link
 * may carry any combination of them. `link_rel` is built by filtering this array
 * rather than the attribute, so one link written `rel="nofollow sponsored"` and
 * another written `rel="sponsored,nofollow"` report the same value.
 *
 * @since n.e.x.t
 */
export const OUTBOUND_REL_QUALIFICATIONS = [ 'sponsored', 'ugc', 'nofollow' ];

/**
 * Classifies a link as a qualified outbound link, or as none of them.
 *
 * @since n.e.x.t
 *
 * @param {HTMLAnchorElement} anchor Anchor that was clicked.
 * @param {URL}               url    Parsed link address.
 * @return {string|null} The `link_rel` to report, or `null` when the link is not a qualified outbound link.
 */
export default function classifyOutboundLink(
	anchor: HTMLAnchorElement,
	url: URL
): string | null {
	// Only a web link points at another site, and an app scheme's own address can
	// name the person being contacted.
	if (
		( 'http:' !== url.protocol && 'https:' !== url.protocol ) ||
		url.hostname === global.location.hostname
	) {
		return null;
	}

	// Every value is collected whole, so `sponsored-post` and `nofollowing` are
	// simply different values rather than partial matches.
	const relValues = new Set(
		( anchor.getAttribute( 'rel' ) || '' )
			.toLowerCase()
			.split( /[\s,]+/ )
			.filter( Boolean )
	);

	return (
		OUTBOUND_REL_QUALIFICATIONS.filter( ( qualification ) =>
			relValues.has( qualification )
		).join( ' ' ) || null
	);
}

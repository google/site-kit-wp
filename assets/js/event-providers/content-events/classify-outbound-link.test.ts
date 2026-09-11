/**
 * Outbound link classification tests.
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
import classifyOutboundLink, {
	OUTBOUND_REL_QUALIFICATIONS,
} from './classify-outbound-link';

const OUTBOUND_HREF = 'https://example.com/deal';

/**
 * Classifies an href and a `rel` the way the listener does.
 *
 * @since n.e.x.t
 *
 * @param {string} rel  Value of the anchor's `rel` attribute; omitted when null.
 * @param {string} href Link address to classify.
 * @return {string|null} The resolved `link_rel`, or `null`.
 */
function classify( rel: string | null, href = OUTBOUND_HREF ): string | null {
	const anchor = global.document.createElement( 'a' );
	anchor.setAttribute( 'href', href );

	if ( null !== rel ) {
		anchor.setAttribute( 'rel', rel );
	}

	return classifyOutboundLink( anchor, new URL( anchor.href ) );
}

describe( 'classifyOutboundLink', () => {
	it.each( [
		[ 'sponsored', 'sponsored' ],
		[ 'ugc', 'ugc' ],
		[ 'nofollow', 'nofollow' ],
	] )( 'should report rel="%s" on its own', ( rel, expected ) => {
		expect( classify( rel ) ).toBe( expected );
	} );

	it.each( [
		[ 'nofollow sponsored', 'sponsored nofollow' ],
		[ 'ugc,nofollow', 'ugc nofollow' ],
		[ 'nofollow ugc sponsored', 'sponsored ugc nofollow' ],
		[ 'ugc sponsored', 'sponsored ugc' ],
	] )(
		'should list rel="%s" in the documented order, not the attribute\'s',
		( rel, expected ) => {
			expect( classify( rel ) ).toBe( expected );
		}
	);

	it.each( [
		[ 'NoFollow', 'nofollow' ],
		[ 'SPONSORED,UGC', 'sponsored ugc' ],
		[ ' ugc , sponsored ', 'sponsored ugc' ],
		[ 'ugc\n\tnofollow', 'ugc nofollow' ],
	] )(
		'should ignore case and extra spacing in rel="%s"',
		( rel, expected ) => {
			expect( classify( rel ) ).toBe( expected );
		}
	);

	it.each( [
		[ 'a missing rel', null ],
		[ 'an empty rel', '' ],
		[ 'a whitespace-only rel', '   ' ],
		[ 'a separator-only rel', ' , ' ],
	] )( 'should return null for %s', ( _label, rel ) => {
		expect( classify( rel ) ).toBeNull();
	} );

	it.each( [
		'noopener',
		'noreferrer',
		'noopener noreferrer',
		'sponsored-post',
		'nofollowing',
		'ugcs',
		'unsponsored',
	] )( 'should return null for rel="%s" on its own', ( rel ) => {
		expect( classify( rel ) ).toBeNull();
	} );

	it.each( [
		[ 'noopener nofollow noreferrer', 'nofollow' ],
		[ 'sponsored-post sponsored', 'sponsored' ],
		[ 'nofollowing ugcs ugc', 'ugc' ],
	] )(
		'should leave everything but a qualification out of rel="%s"',
		( rel, expected ) => {
			expect( classify( rel ) ).toBe( expected );
		}
	);

	it.each( [
		[ 'https://example.com/x?ref=1', 'nofollow' ],
		[ 'https://shop.example.com/', 'nofollow' ],
		[ 'https://www.example.com/deal', 'nofollow' ],
		[ 'http://example.com/deal', 'nofollow' ],
	] )( 'should classify the different-host link %s', ( href, expected ) => {
		expect( classify( 'nofollow', href ) ).toBe( expected );
	} );

	// Read from `location` rather than hardcoded, so these stay same-host
	// whatever address the test environment serves them from.
	const { hostname } = global.location;

	it.each( [
		[ 'a relative address', '/about' ],
		[ 'the same host written in full', `http://${ hostname }/about` ],
		[ 'the same host on another scheme', `https://${ hostname }/about` ],
		[ 'the same host on another port', `http://${ hostname }:8080/about` ],
	] )( 'should return null for %s', ( _label, href ) => {
		expect( classify( 'sponsored', href ) ).toBeNull();
	} );

	it.each( [
		'javascript:void(0)', // eslint-disable-line no-script-url
		'mailto:hello@example.com',
		'tel:+15551234567',
		// An app scheme's address can name the person being contacted, and the
		// contact classifier only knows the apps it lists — so none of them may
		// reach an event that reports the address.
		'whatsapp://send?text=Come%20see%20this',
		'viber://forward?text=Hello',
		'msteams://l/chat/0/0?users=hello@example.com',
		'slack://user?team=T012AB&id=U345CD',
		'zoommtg://zoom.us/join?confno=8412345678&pwd=secret',
		'webcal://cal.example.com/u/hello@example.com.ics',
		'ftp://files.example.com/pub',
	] )( 'should return null for the non-web link %s', ( href ) => {
		expect( classify( 'nofollow', href ) ).toBeNull();
	} );

	describe( 'OUTBOUND_REL_QUALIFICATIONS', () => {
		it( 'should list the three documented qualifications, in order', () => {
			expect( OUTBOUND_REL_QUALIFICATIONS ).toEqual( [
				'sponsored',
				'ugc',
				'nofollow',
			] );
		} );
	} );
} );

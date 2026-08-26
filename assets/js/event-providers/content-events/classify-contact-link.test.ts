/**
 * Contact link classification tests.
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
import classifyContactLink, {
	CONTACT_LINK_MATCHERS,
	ContactLinkType,
} from './classify-contact-link';

/**
 * Classifies an href through a real anchor, the way the listener does.
 *
 * @since n.e.x.t
 *
 * @param {string} href Link address to classify.
 * @return {string|null} The resolved `link_type`, or `null`.
 */
function classify( href: string ): ContactLinkType | null {
	const anchor = global.document.createElement( 'a' );
	anchor.setAttribute( 'href', href );

	return classifyContactLink( anchor );
}

describe( 'classifyContactLink', () => {
	describe.each( [
		[ 'phone', [ 'tel:+15551234567', 'TEL:+15551234567' ], [] as string[] ],
		[
			'email',
			[ 'mailto:hello@example.com', 'MAILTO:hello@example.com' ],
			[] as string[],
		],
		[ 'sms', [ 'sms:+15551234567', 'smsto:+15551234567' ], [] as string[] ],
		[
			'whatsapp',
			[
				'https://wa.me/15551234567',
				'https://wa.me/message/ABC123',
				'https://wa.me/qr/ABC123',
				'https://wa.me/QR/ABC123',
				'https://www.wa.me/15551234567',
				'https://api.whatsapp.com/send?phone=15551234567',
				'https://web.whatsapp.com/send?phone=15551234567',
				'whatsapp://send?phone=15551234567',
			],
			[
				'https://wa.me/?text=Hello',
				'https://wa.me/notanumber',
				'https://wa.me/',
				'https://api.whatsapp.com/send?text=Hello',
				'https://chat.whatsapp.com/ABCDEF123456',
			],
		],
		[
			'messenger',
			[
				'https://m.me/acme',
				'https://messenger.com/t/12345',
				'https://www.messenger.com/t/12345',
				'fb-messenger://user-thread/12345',
				'fb-messenger://user/12345',
			],
			[ 'https://m.me/', 'https://messenger.com/' ],
		],
		[
			'telegram',
			[
				'https://t.me/acme',
				'https://telegram.me/acme',
				'https://www.t.me/acme',
				'tg://resolve?domain=acme',
				'https://WWW.T.me/Acme',
			],
			[
				'https://t.me/share/url?url=https%3A%2F%2Fexample.com',
				'https://t.me/joinchat/ABCDEF',
				'https://t.me/JoinChat/ABCDEF',
				'https://t.me/Share/url?url=https%3A%2F%2Fexample.com',
				'https://t.me/+ABCDEF',
				'https://t.me/addstickers/example',
				'https://t.me/proxy?server=example.com',
				'https://t.me/',
				'tg://resolve',
			],
		],
		[
			'viber',
			[
				'viber://chat?number=%2B15551234567',
				'viber://add?number=%2B15551234567',
				'viber://pa?chatURI=acme',
			],
			[ 'viber://forward?text=Hello' ],
		],
		[
			'signal',
			[
				'https://signal.me/#p/+15551234567',
				'https://www.signal.me/#p/+15551234567',
				'sgnl://signal.me/#p/+15551234567',
			],
			[ 'https://signal.me/', 'https://signal.group/#ABCDEF' ],
		],
		[
			'line',
			[
				'https://line.me/R/ti/p/@acme',
				'https://line.me/ti/p/@acme',
				'https://www.line.me/R/ti/p/@acme',
				'https://line.me/r/ti/p/@acme',
				'https://page.line.me/acme',
				'line://ti/p/@acme',
			],
			[
				'https://line.me/R/msg/text/?Hello',
				'https://social-plugins.line.me/lineit/share?url=https%3A%2F%2Fexample.com',
				'https://page.line.me/',
			],
		],
	] )( '%s', ( linkType, classified, unclassified ) => {
		it.each( classified )( 'should classify %s', ( href ) => {
			expect( classify( href ) ).toBe( linkType );
		} );

		if ( unclassified.length ) {
			it.each( unclassified )( 'should not classify %s', ( href ) => {
				expect( classify( href ) ).toBeNull();
			} );
		}
	} );

	it.each( [
		'https://evil.com/?r=wa.me',
		'https://notwa.me/1555',
		'https://wa.me.evil.com/1555',
		'https://sub.t.me/acme',
	] )(
		'should match hosts exactly, so %s classifies as nothing',
		( href ) => {
			expect( classify( href ) ).toBeNull();
		}
	);

	it.each( [
		'https://constructor/',
		'https://__proto__/',
		'https://www.constructor/x',
	] )(
		'should return null, not an inherited property, for the prototype-key host %s',
		( href ) => {
			// The parser lower-cases the host, so `toString` and friends can
			// never reach the index — but `constructor` and `__proto__` can.
			expect( classify( href ) ).toBeNull();
		}
	);

	it( 'should return null for a malformed href rather than throwing', () => {
		const anchor = global.document.createElement( 'a' );
		// An anchor with no href attribute reports an empty string, which the
		// URL parser rejects.
		anchor.removeAttribute( 'href' );

		expect( () => classifyContactLink( anchor ) ).not.toThrow();
		expect( classifyContactLink( anchor ) ).toBeNull();
	} );

	describe( 'CONTACT_LINK_MATCHERS', () => {
		const DOCUMENTED_TYPES = [
			'phone',
			'email',
			'sms',
			'whatsapp',
			'messenger',
			'telegram',
			'viber',
			'signal',
			'line',
		];

		it( 'should list every documented type once, in order', () => {
			expect( CONTACT_LINK_MATCHERS.map( ( m ) => m.type ) ).toEqual(
				DOCUMENTED_TYPES
			);
		} );

		it( 'should claim no host for more than one type', () => {
			const hosts = CONTACT_LINK_MATCHERS.flatMap(
				( matcher ) => matcher.hosts || []
			);

			expect( hosts ).toHaveLength( new Set( hosts ).size );
		} );

		it( 'should claim no scheme for more than one type', () => {
			const schemes = CONTACT_LINK_MATCHERS.flatMap(
				( matcher ) => matcher.schemes || []
			);

			expect( schemes ).toHaveLength( new Set( schemes ).size );
		} );

		it( 'should list none of the share-only or group-only hosts', () => {
			const hosts = CONTACT_LINK_MATCHERS.flatMap(
				( matcher ) => matcher.hosts || []
			);

			expect( hosts ).not.toContain( 'chat.whatsapp.com' );
			expect( hosts ).not.toContain( 'signal.group' );
			expect( hosts ).not.toContain( 'social-plugins.line.me' );
		} );
	} );
} );

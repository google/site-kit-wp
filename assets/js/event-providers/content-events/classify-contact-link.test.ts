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
function classifyHref( href: string ): ContactLinkType | null {
	const anchor = global.document.createElement( 'a' );
	anchor.setAttribute( 'href', href );

	return classifyContactLink( anchor );
}

describe( 'classifyContactLink', () => {
	// One case per address: what it is, and the `link_type` it must report.
	// `null` means the address sits on a contact host but names nobody to
	// contact, so this event must let it through to #13291 instead.
	const CLASSIFICATION_CASES: Array< [ string, ContactLinkType | null ] > = [
		// Phone, email and SMS are recognized by scheme alone.
		[ 'tel:+15551234567', 'phone' ],
		[ 'TEL:+15551234567', 'phone' ],
		[ 'mailto:hello@example.com', 'email' ],
		[ 'MAILTO:hello@example.com', 'email' ],
		[ 'sms:+15551234567', 'sms' ],
		[ 'smsto:+15551234567', 'sms' ],

		// WhatsApp.
		[ 'https://wa.me/15551234567', 'whatsapp' ],
		[ 'https://wa.me/message/ABC123', 'whatsapp' ],
		[ 'https://wa.me/qr/ABC123', 'whatsapp' ],
		[ 'https://wa.me/QR/ABC123', 'whatsapp' ],
		[ 'https://www.wa.me/15551234567', 'whatsapp' ],
		[ 'https://api.whatsapp.com/send?phone=15551234567', 'whatsapp' ],
		[ 'https://web.whatsapp.com/send?phone=15551234567', 'whatsapp' ],
		[ 'whatsapp://send?phone=15551234567', 'whatsapp' ],
		[ 'https://wa.me/?text=Hello', null ], // Share link.
		[ 'https://api.whatsapp.com/send?text=Hello', null ], // Share link.
		[ 'https://wa.me/notanumber', null ], // Not a phone number.
		[ 'https://wa.me/', null ], // No recipient.
		[ 'https://chat.whatsapp.com/ABCDEF123456', null ], // Group invite.

		// Messenger.
		[ 'https://m.me/acme', 'messenger' ],
		[ 'https://messenger.com/t/12345', 'messenger' ],
		[ 'https://www.messenger.com/t/12345', 'messenger' ],
		[ 'fb-messenger://user-thread/12345', 'messenger' ],
		[ 'fb-messenger://user/12345', 'messenger' ],
		[ 'fb-messenger://USER-THREAD/12345', 'messenger' ],
		[ 'https://m.me/', null ], // No recipient.
		[ 'https://messenger.com/', null ], // No recipient.

		// Telegram.
		[ 'https://t.me/acme', 'telegram' ],
		[ 'https://telegram.me/acme', 'telegram' ],
		[ 'https://www.t.me/acme', 'telegram' ],
		[ 'https://WWW.T.me/Acme', 'telegram' ],
		[ 'tg://resolve?domain=acme', 'telegram' ],
		[ 'tg://RESOLVE?domain=acme', 'telegram' ],
		[ 'https://t.me/share/url?url=https%3A%2F%2Fexample.com', null ], // Share link.
		[ 'https://t.me/Share/url?url=https%3A%2F%2Fexample.com', null ], // Share link.
		[ 'https://t.me/joinchat/ABCDEF', null ], // Group invite.
		[ 'https://t.me/JoinChat/ABCDEF', null ], // Group invite.
		[ 'https://t.me/+ABCDEF', null ], // Group invite.
		[ 'https://t.me/addstickers/example', null ], // Sticker pack.
		[ 'https://t.me/proxy?server=example.com', null ], // Proxy.
		[ 'https://t.me/', null ], // No recipient.
		[ 'tg://resolve', null ], // No recipient.

		// Viber.
		[ 'viber://chat?number=%2B15551234567', 'viber' ],
		[ 'viber://add?number=%2B15551234567', 'viber' ],
		[ 'viber://pa?chatURI=acme', 'viber' ],
		[ 'VIBER://CHAT?number=%2B15551234567', 'viber' ],
		[ 'viber://forward?text=Hello', null ], // Share link.

		// Signal.
		[ 'https://signal.me/#p/+15551234567', 'signal' ],
		[ 'https://www.signal.me/#p/+15551234567', 'signal' ],
		[ 'sgnl://signal.me/#p/+15551234567', 'signal' ],
		[ 'https://signal.me/', null ], // No recipient.
		[ 'https://signal.group/#ABCDEF', null ], // Group invite.

		// LINE.
		[ 'https://line.me/R/ti/p/@acme', 'line' ],
		[ 'https://line.me/r/ti/p/@acme', 'line' ],
		[ 'https://line.me/ti/p/@acme', 'line' ],
		[ 'https://www.line.me/R/ti/p/@acme', 'line' ],
		[ 'https://page.line.me/acme', 'line' ],
		[ 'line://ti/p/@acme', 'line' ],
		[ 'https://line.me/R/msg/text/?Hello', null ], // Prefilled message.
		[
			'https://social-plugins.line.me/lineit/share?url=https%3A%2F%2Fexample.com',
			null,
		], // Share widget.
		[ 'https://page.line.me/', null ], // No recipient.
	];

	it.each( CLASSIFICATION_CASES )(
		'should classify %s as %s',
		( href, expected ) => {
			expect( classifyHref( href ) ).toBe( expected );
		}
	);

	it.each( [
		'https://evil.com/?r=wa.me',
		'https://notwa.me/1555',
		'https://wa.me.evil.com/1555',
		'https://sub.t.me/acme',
	] )(
		'should match hosts exactly, so %s classifies as nothing',
		( href ) => {
			expect( classifyHref( href ) ).toBeNull();
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
			expect( classifyHref( href ) ).toBeNull();
		}
	);

	it( 'should return null for a malformed href rather than throwing', () => {
		const anchor = global.document.createElement( 'a' );
		// An unclosed IPv6 host, which the URL parser rejects.
		anchor.setAttribute( 'href', 'http://[' );

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
			expect(
				CONTACT_LINK_MATCHERS.map( ( matcher ) => matcher.type )
			).toEqual( DOCUMENTED_TYPES );
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

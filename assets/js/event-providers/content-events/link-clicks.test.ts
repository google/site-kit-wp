/**
 * Link click engagement event tracking tests.
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
import { initializeLinkClicks } from './link-clicks';
import {
	SiteKitGlobal,
	createListenerTracker,
	preventNavigation,
	render,
} from './test-utils';

// Wraps both real classifiers in spies: the tests still get their real return
// values, and can also assert whether the listener called each one at all.
jest.mock( './classify-contact-link', () => {
	const actual = jest.requireActual( './classify-contact-link' );

	return {
		__esModule: true,
		...actual,
		default: jest.fn( actual.default ),
	};
} );

jest.mock( './classify-outbound-link', () => {
	const actual = jest.requireActual( './classify-outbound-link' );

	return {
		__esModule: true,
		...actual,
		default: jest.fn( actual.default ),
	};
} );

const classifyContactSpy = classifyContactLink as jest.Mock;
const classifyOutboundSpy = classifyOutboundLink as jest.Mock;

describe( 'initializeLinkClicks', () => {
	let gtagEventMock: jest.Mock;

	const listeners = createListenerTracker();

	function initialize() {
		return listeners.record( initializeLinkClicks );
	}

	beforeEach( () => {
		classifyContactSpy.mockClear();
		classifyOutboundSpy.mockClear();
		gtagEventMock = jest.fn();
		global._googlesitekit = { gtagEvent: gtagEventMock };
		global.document.body.innerHTML = '';
		listeners.reset();
		// Every anchor here has a real href, which jsdom would try to
		// navigate to and log "Not implemented: navigation" for.
		global.document.addEventListener( 'click', preventNavigation );
	} );

	afterEach( () => {
		listeners.removeAll();
		global.document.removeEventListener( 'click', preventNavigation );
		global.document.body.innerHTML = '';
		delete ( global as { _googlesitekit?: SiteKitGlobal } )._googlesitekit;
	} );

	it( 'should emit one event with "link_type" and the transport, and nothing identifying', () => {
		const anchor = render(
			'<a href="https://wa.me/15551234567">Message us</a>'
		);
		initialize();

		( anchor as HTMLAnchorElement ).click();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith( 'contact_link_click', {
			link_type: 'whatsapp',
			transport_type: 'beacon',
		} );

		// Nothing in the payload may carry the recipient or the address.
		const payload = JSON.stringify( gtagEventMock.mock.calls[ 0 ][ 1 ] );

		[ '15551234567', 'wa.me', 'Message us' ].forEach( ( identifier ) => {
			expect( payload ).not.toContain( identifier );
		} );
	} );

	it( 'should resolve a click on a child element up to the anchor', () => {
		render(
			'<a href="tel:+15551234567"><svg class="icon"></svg><span class="label">Call</span></a>'
		);
		initialize();

		global.document.querySelector( '.label' )?.dispatchEvent(
			new global.MouseEvent( 'click', {
				bubbles: true,
				cancelable: true,
			} )
		);

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith( 'contact_link_click', {
			link_type: 'phone',
		} );
	} );

	it( 'should resolve a click on an image inside the anchor', () => {
		render(
			'<a href="mailto:hello@example.com"><img alt="Email us" /></a>'
		);
		initialize();

		global.document.querySelector( 'img' )?.dispatchEvent(
			new global.MouseEvent( 'click', {
				bubbles: true,
				cancelable: true,
			} )
		);

		expect( gtagEventMock ).toHaveBeenCalledWith( 'contact_link_click', {
			link_type: 'email',
		} );
	} );

	it( 'should never have a prefilled subject, body, or message text', () => {
		render(
			'<a href="https://wa.me/15551234567?text=Secret%20message">Message</a>'
		);
		initialize();

		global.document.querySelector< HTMLAnchorElement >( 'a' )?.click();

		expect( gtagEventMock ).toHaveBeenCalledWith( 'contact_link_click', {
			link_type: 'whatsapp',
			transport_type: 'beacon',
		} );
		expect(
			JSON.stringify( gtagEventMock.mock.calls[ 0 ][ 1 ] )
		).not.toContain( 'Secret' );
	} );

	it( 'should classify an anchor added to the page after the initial page load', () => {
		initialize();

		const anchor = render( '<a href="https://m.me/acme">Chat</a>' );
		( anchor as HTMLAnchorElement ).click();

		expect( gtagEventMock ).toHaveBeenCalledWith(
			'contact_link_click',
			expect.objectContaining( { link_type: 'messenger' } )
		);
	} );

	it.each( [
		[ 'https://t.me/acme', 'telegram', true ],
		[ 'tel:+15551234567', 'phone', false ],
		[ 'mailto:hello@example.com', 'email', false ],
		[ 'sms:+15551234567', 'sms', false ],
		[ 'whatsapp://send?phone=15551234567', 'whatsapp', false ],
	] )(
		'should set the beacon transport type only for web links — %s',
		( href, linkType, expectsBeacon ) => {
			const anchor = render( `<a href="${ href }">Contact</a>` );
			initialize();

			( anchor as HTMLAnchorElement ).click();

			expect( gtagEventMock ).toHaveBeenCalledWith(
				'contact_link_click',
				expectsBeacon
					? { link_type: linkType, transport_type: 'beacon' }
					: { link_type: linkType }
			);
		}
	);

	it.each( [
		[ 'an unclassified anchor', '<a href="https://example.com/">Read</a>' ],
		[ 'a non-anchor element', '<div class="not-a-link">Text</div>' ],
		[ 'an anchor without href', '<a class="no-href">Nowhere</a>' ],
		[ 'a share link', '<a href="https://wa.me/?text=Hello">Share</a>' ],
		[
			'a group invite',
			'<a href="https://chat.whatsapp.com/ABCDEF">Join</a>',
		],
		[
			'an outbound link with no rel',
			'<a href="https://example.com/deal">Deal</a>',
		],
		[
			'an outbound link qualified by nothing this event reports',
			'<a href="https://example.com/x" rel="noopener noreferrer">Read</a>',
		],
		[
			'an outbound link whose rel only looks qualified',
			'<a href="https://example.com/x" rel="sponsored-post">Read</a>',
		],
		[
			'a qualified link that stays on this site',
			'<a href="/about" rel="sponsored">About</a>',
		],
		[
			'a qualified link that stays on this site, written in full',
			`<a href="http://${ global.location.hostname }/about" rel="ugc">About</a>`,
		],
		[
			'a qualified link that opens no address',
			'<a href="javascript:void(0)" rel="nofollow">Nowhere</a>',
		],
		[
			'a qualified app-scheme link the contact classifier does not list',
			'<a href="msteams://l/chat/0/0?users=hello@example.com" rel="nofollow">Chat</a>',
		],
		[
			'a qualified messaging share link',
			'<a href="whatsapp://send?text=Hello" rel="nofollow">Share</a>',
		],
	] )( 'should emit nothing for %s', ( _label, markup ) => {
		const element = render( markup );
		initialize();

		element.dispatchEvent(
			new global.MouseEvent( 'click', {
				bubbles: true,
				cancelable: true,
			} )
		);

		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it.each( [ 'nofollow', 'sponsored', 'ugc' ] )(
		'should emit exactly one event for a contact link with rel="%s"',
		( rel ) => {
			const anchor = render(
				`<a href="https://wa.me/15551234567" rel="${ rel }">Message us</a>`
			);
			initialize();

			( anchor as HTMLAnchorElement ).click();

			expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
			expect( gtagEventMock ).toHaveBeenCalledWith(
				'contact_link_click',
				expect.objectContaining( { link_type: 'whatsapp' } )
			);
			expect( gtagEventMock ).not.toHaveBeenCalledWith(
				'outbound_link_click',
				expect.anything()
			);

			// The address holds the phone number, so it may reach no payload.
			const payload = JSON.stringify(
				gtagEventMock.mock.calls[ 0 ][ 1 ]
			);

			[ '15551234567', 'wa.me' ].forEach( ( identifier ) => {
				expect( payload ).not.toContain( identifier );
			} );
		}
	);

	// An anchor with no address is not a link, so neither classifier may see it.
	it( 'should not resolve an anchor that has no href', () => {
		const anchor = render( '<a class="no-href">Nowhere</a>' );
		initialize();

		anchor.dispatchEvent(
			new global.MouseEvent( 'click', {
				bubbles: true,
				cancelable: true,
			} )
		);

		expect( classifyContactSpy ).not.toHaveBeenCalled();
		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'should resolve an anchor that has an href', () => {
		const anchor = render( '<a href="https://example.com/">Read</a>' );
		initialize();

		( anchor as HTMLAnchorElement ).click();

		expect( classifyContactSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should register one document click listener', () => {
		const added = initialize();

		expect( added ).toHaveLength( 1 );
		expect( added[ 0 ][ 0 ] ).toBe( 'click' );
		expect( typeof added[ 0 ][ 1 ] ).toBe( 'function' );
	} );

	it.each( [
		[
			'a contact link',
			'<a href="tel:+15551234567">Call</a>',
			'contact_link_click',
			{ link_type: 'phone' },
		],
		[
			'a qualified outbound link',
			'<a href="https://example.com/deal" rel="sponsored">Deal</a>',
			'outbound_link_click',
			{ link_rel: 'sponsored' },
		],
	] )(
		'should ensure clicking %s still opens the URL',
		( _label, markup, eventName, payload ) => {
			// The shared preventNavigation listener runs before this one and
			// would make defaultPrevented true, so it steps aside here and the
			// probe below swallows the click instead.
			global.document.removeEventListener( 'click', preventNavigation );

			const anchor = render< HTMLAnchorElement >( markup );
			initialize();

			let preventedWhenProbed: boolean | undefined;

			function probe( event: Event ) {
				preventedWhenProbed = event.defaultPrevented;
				event.preventDefault();
			}

			// Registered after the initializer, so reaching it at all also
			// shows the tracking listener let the click carry on.
			global.document.addEventListener( 'click', probe );
			anchor.click();
			global.document.removeEventListener( 'click', probe );

			expect( preventedWhenProbed ).toBe( false );
			expect( gtagEventMock ).toHaveBeenCalledWith(
				eventName,
				expect.objectContaining( payload )
			);
		}
	);

	it( "should keep tracking later clicks when one click's handling throws", () => {
		render(
			'<a href="tel:+15551234567">Call</a>' +
				'<a href="mailto:hello@example.com">Email</a>'
		);
		initialize();

		const [ first, second ] = Array.from(
			global.document.querySelectorAll< HTMLAnchorElement >( 'a[href]' )
		);

		gtagEventMock.mockImplementationOnce( () => {
			throw new Error( 'boom' );
		} );

		first.click();
		second.click();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 2 );
		expect( gtagEventMock ).toHaveBeenLastCalledWith(
			'contact_link_click',
			{ link_type: 'email' }
		);

		// Restoring a local `console.error` spy would leave every test after
		// this one unable to notice an error it never expected.
		expect( console ).toHaveErroredWith(
			'Site Kit: failed to track this link click.',
			new Error( 'boom' )
		);
	} );
	describe( 'outbound_link_click', () => {
		it( 'should emit one event carrying the rel, the address and the transport', () => {
			const anchor = render< HTMLAnchorElement >(
				'<a href="https://example.com/deal" rel="sponsored">Deal</a>'
			);
			initialize();

			anchor.click();

			expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
			expect( gtagEventMock ).toHaveBeenCalledWith(
				'outbound_link_click',
				{
					link_rel: 'sponsored',
					link_url: 'https://example.com/deal',
					link_domain: 'example.com',
					transport_type: 'beacon',
				}
			);
		} );

		it.each( [
			[
				'<a href="https://example.com/post" rel="ugc">Post</a>',
				'ugc',
				'https://example.com/post',
				'example.com',
			],
			[
				'<a href="https://example.com/x?ref=1" rel="nofollow">X</a>',
				'nofollow',
				'https://example.com/x?ref=1',
				'example.com',
			],
			[
				'<a href="https://shop.example.com/" rel="nofollow sponsored">Shop</a>',
				'sponsored nofollow',
				'https://shop.example.com/',
				'shop.example.com',
			],
			[
				'<a href="https://example.com/x" rel="ugc,nofollow">X</a>',
				'ugc nofollow',
				'https://example.com/x',
				'example.com',
			],
			[
				'<a href="https://example.com/x" rel="noopener nofollow noreferrer">X</a>',
				'nofollow',
				'https://example.com/x',
				'example.com',
			],
			// The contact classifier strips a `www.` prefix to match its hosts,
			// so this reports the address the visitor actually clicked.
			[
				'<a href="https://www.example.com/deal" rel="NoFollow">Deal</a>',
				'nofollow',
				'https://www.example.com/deal',
				'www.example.com',
			],
		] )(
			'should report %s as link_rel "%s"',
			( markup, linkRel, linkURL, linkDomain ) => {
				const anchor = render< HTMLAnchorElement >( markup );
				initialize();

				anchor.click();

				expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
				expect( gtagEventMock ).toHaveBeenCalledWith(
					'outbound_link_click',
					{
						link_rel: linkRel,
						link_url: linkURL,
						link_domain: linkDomain,
						transport_type: 'beacon',
					}
				);
			}
		);

		it( 'should resolve a click on a child element up to the anchor', () => {
			render(
				'<a href="https://example.com/deal" rel="sponsored"><svg class="icon"></svg><span class="label">Deal</span></a>'
			);
			initialize();

			global.document.querySelector( '.label' )?.dispatchEvent(
				new global.MouseEvent( 'click', {
					bubbles: true,
					cancelable: true,
				} )
			);

			expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
			expect( gtagEventMock ).toHaveBeenCalledWith(
				'outbound_link_click',
				expect.objectContaining( { link_rel: 'sponsored' } )
			);
		} );

		it( 'should classify an anchor appended after initialization', () => {
			initialize();

			const anchor = render< HTMLAnchorElement >(
				'<a href="https://example.com/x" rel="ugc">Post</a>'
			);
			anchor.click();

			expect( gtagEventMock ).toHaveBeenCalledWith(
				'outbound_link_click',
				expect.objectContaining( { link_rel: 'ugc' } )
			);
		} );

		it( 'should hand both classifiers the same parsed URL for one click', () => {
			const anchor = render< HTMLAnchorElement >(
				'<a href="https://example.com/deal" rel="sponsored">Deal</a>'
			);
			initialize();

			anchor.click();

			expect( classifyContactSpy ).toHaveBeenCalledTimes( 1 );
			expect( classifyOutboundSpy ).toHaveBeenCalledTimes( 1 );
			expect( classifyOutboundSpy.mock.calls[ 0 ][ 1 ] ).toBe(
				classifyContactSpy.mock.calls[ 0 ][ 0 ]
			);
		} );

		it( 'should emit nothing for an address the parser rejects, and keep emitting after it', () => {
			render(
				// An unclosed IPv6 host, which the URL parser rejects.
				'<a href="http://[" rel="nofollow">Broken</a>' +
					'<a href="https://example.com/deal" rel="sponsored">Deal</a>'
			);
			initialize();

			const [ broken, deal ] = Array.from(
				global.document.querySelectorAll< HTMLAnchorElement >(
					'a[href]'
				)
			);

			broken.click();

			expect( gtagEventMock ).not.toHaveBeenCalled();
			expect( classifyContactSpy ).not.toHaveBeenCalled();

			deal.click();

			expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
			expect( gtagEventMock ).toHaveBeenCalledWith(
				'outbound_link_click',
				expect.objectContaining( { link_rel: 'sponsored' } )
			);
		} );
	} );
} );

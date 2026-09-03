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
import { initializeLinkClicks } from './link-clicks';
import {
	SiteKitGlobal,
	createListenerTracker,
	preventNavigation,
	render,
} from './test-utils';

// Wraps the real `classifyContactLink` in a spy: the tests still get its real
// return values, and can also assert whether the listener called it at all.
jest.mock( './classify-contact-link', () => {
	const actual = jest.requireActual( './classify-contact-link' );

	return {
		__esModule: true,
		...actual,
		default: jest.fn( actual.default ),
	};
} );

const classifySpy = classifyContactLink as jest.Mock;

describe( 'initializeLinkClicks', () => {
	let gtagEventMock: jest.Mock;

	const listeners = createListenerTracker();

	function initialize() {
		return listeners.record( initializeLinkClicks );
	}

	beforeEach( () => {
		classifySpy.mockClear();
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
		}
	);

	// `closest( 'a[href]' )`, not `closest( 'a' )`: an anchor with no address is
	// not a link, and #13291 handles whatever this leaves unclassified — so it
	// must never be resolved in the first place.
	it( 'should not resolve an anchor that has no href', () => {
		const anchor = render( '<a class="no-href">Nowhere</a>' );
		initialize();

		anchor.dispatchEvent(
			new global.MouseEvent( 'click', {
				bubbles: true,
				cancelable: true,
			} )
		);

		expect( classifySpy ).not.toHaveBeenCalled();
		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'should resolve an anchor that has an href', () => {
		const anchor = render( '<a href="https://example.com/">Read</a>' );
		initialize();

		( anchor as HTMLAnchorElement ).click();

		expect( classifySpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should register one document click listener', () => {
		const added = initialize();

		expect( added ).toHaveLength( 1 );
		expect( added[ 0 ][ 0 ] ).toBe( 'click' );
		expect( typeof added[ 0 ][ 1 ] ).toBe( 'function' );
	} );

	it( 'should ensure clicking the link still opens the URL', () => {
		// The shared preventNavigation listener runs before this one and would
		// make defaultPrevented true, so it steps aside here and the probe below
		// swallows the click instead.
		global.document.removeEventListener( 'click', preventNavigation );

		const anchor = render< HTMLAnchorElement >(
			'<a href="tel:+15551234567">Call</a>'
		);
		initialize();

		let preventedWhenProbed: boolean | undefined;

		function probe( event: Event ) {
			preventedWhenProbed = event.defaultPrevented;
			event.preventDefault();
		}

		// Registered after the initializer, so it sees whatever the tracking
		// listener did to the event.
		global.document.addEventListener( 'click', probe );
		anchor.click();
		global.document.removeEventListener( 'click', probe );

		expect( preventedWhenProbed ).toBe( false );
		expect( gtagEventMock ).toHaveBeenCalledWith( 'contact_link_click', {
			link_type: 'phone',
		} );
	} );

	it( "should keep tracking later clicks when one click's handling throws", () => {
		// Mock console.error since this test intentionally triggers it.
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

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
		expect( consoleErrorSpy ).toHaveBeenCalledWith(
			'Site Kit: failed to track this link click.',
			expect.any( Error )
		);

		second.click();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 2 );
		expect( gtagEventMock ).toHaveBeenLastCalledWith(
			'contact_link_click',
			{ link_type: 'email' }
		);

		consoleErrorSpy.mockRestore();
	} );
} );

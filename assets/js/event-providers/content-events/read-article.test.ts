/**
 * Read article event tracking tests.
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
 * External dependencies
 */
import { intersectionObserver } from '@shopify/jest-dom-mocks';

/**
 * Internal dependencies
 */
import { ContentEventsConfig } from '@/js/event-providers/content-events';
import { initializeReadArticle } from './read-article';

type SiteKitGlobal = typeof global._googlesitekit;

/** Waiting time for the default configuration: 85% of the 120-second estimate. */
const REQUIRED_WAIT_MS = 102000;

/** Longer than any waiting time these tests set, so nothing is left to wait for. */
const LONGER_THAN_ANY_WAIT_MS = 600000;

const SCROLL_HEIGHT = 4000;
const VIEWPORT_HEIGHT = 800;

/**
 * Builds the configuration the initializer reads, for the last page of a single
 * post.
 *
 * @since n.e.x.t
 *
 * @param {Object} overrides Fields to write over the default ones.
 * @return {ContentEventsConfig} Content events configuration.
 */
function baseConfig(
	overrides: Partial< ContentEventsConfig > = {}
): ContentEventsConfig {
	return {
		postID: 42,
		isSinglePost: true,
		hasVimeoEmbed: false,
		wordCount: 476,
		estimatedReadTimeSeconds: 120,
		isFinalPage: true,
		readTimeThresholdPercent: 85,
		minimumReadTimeSeconds: 5,
		...overrides,
	};
}

describe( 'initializeReadArticle', () => {
	let gtagEventMock: jest.Mock;
	let windowListenerSpy: jest.SpyInstance;
	let documentListenerSpy: jest.SpyInstance;
	let windowRemovalSpy: jest.SpyInstance;
	let documentRemovalSpy: jest.SpyInstance;
	let hasFocus: boolean;

	/**
	 * Renders a post whose content ends with the marker PHP appends.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function renderPostWithMarker(): void {
		global.document.body.innerHTML =
			'<article>Post content.<span class="googlesitekit-end-of-content" aria-hidden="true" style="display:block;height:1px"></span></article>';
	}

	/**
	 * Renders a post whose content has no marker, the way a page builder
	 * does.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function renderPostWithoutMarker(): void {
		global.document.body.innerHTML = '<article>Post content.</article>';
	}

	/**
	 * Sets what the page reports for its scroll position.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} depth Share of the page scrolled past. The fixture's top
	 *                       is `0.2` and its bottom is `1`.
	 * @return {void}
	 */
	function placePageAt( depth: number ): void {
		Object.defineProperty( global, 'scrollY', {
			configurable: true,
			value: depth * SCROLL_HEIGHT - VIEWPORT_HEIGHT,
		} );
	}

	/**
	 * Moves the page to a depth and fires the `scroll` event.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} depth Share of the page scrolled past.
	 * @return {void}
	 */
	function scrollPageTo( depth: number ): void {
		placePageAt( depth );
		global.dispatchEvent( new Event( 'scroll' ) );
	}

	/**
	 * Marks the page visible, without firing a visibility event.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function markPageVisible(): void {
		Object.defineProperty( global.document, 'visibilityState', {
			configurable: true,
			get: () => 'visible',
		} );
	}

	/**
	 * Marks the page hidden, without firing a visibility event.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function markPageHidden(): void {
		Object.defineProperty( global.document, 'visibilityState', {
			configurable: true,
			get: () => 'hidden',
		} );
	}

	/**
	 * Hides the page, the way switching to another browser tab does.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function hidePage(): void {
		markPageHidden();
		global.document.dispatchEvent( new Event( 'visibilitychange' ) );
	}

	/**
	 * Shows the page again, the way returning to the browser tab does.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function showPage(): void {
		markPageVisible();
		global.document.dispatchEvent( new Event( 'visibilitychange' ) );
	}

	/**
	 * Sends the window to the background, the way switching to another window does.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function blurWindow(): void {
		hasFocus = false;
		global.dispatchEvent( new Event( 'blur' ) );
	}

	/**
	 * Brings the window back to the front, the way switching back to it does.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function focusWindow(): void {
		hasFocus = true;
		global.dispatchEvent( new Event( 'focus' ) );
	}

	beforeEach( () => {
		jest.useFakeTimers();
		intersectionObserver.mock();

		gtagEventMock = jest.fn();
		global._googlesitekit = { gtagEvent: gtagEventMock };

		renderPostWithMarker();

		Object.defineProperty( global, 'innerHeight', {
			configurable: true,
			value: VIEWPORT_HEIGHT,
		} );
		Object.defineProperty(
			global.document.documentElement,
			'scrollHeight',
			{
				configurable: true,
				value: SCROLL_HEIGHT,
			}
		);
		placePageAt( 0.2 );

		markPageVisible();
		hasFocus = true;
		jest.spyOn( global.document, 'hasFocus' ).mockImplementation(
			() => hasFocus
		);

		windowListenerSpy = jest.spyOn( global, 'addEventListener' );
		documentListenerSpy = jest.spyOn( global.document, 'addEventListener' );
		windowRemovalSpy = jest.spyOn( global, 'removeEventListener' );
		documentRemovalSpy = jest.spyOn(
			global.document,
			'removeEventListener'
		);
	} );

	afterEach( () => {
		// `initializeReadArticle()` removes its own listeners only after it
		// sends the event, and most tests here never send one. A listener left
		// behind reacts to the next test's scrolls and focus changes.
		windowListenerSpy.mock.calls.forEach( ( [ type, listener ] ) => {
			global.removeEventListener( type, listener );
		} );
		documentListenerSpy.mock.calls.forEach( ( [ type, listener ] ) => {
			global.document.removeEventListener( type, listener );
		} );

		jest.restoreAllMocks();
		intersectionObserver.restore();

		delete ( global as { _googlesitekit?: SiteKitGlobal } )._googlesitekit;
		global.document.body.innerHTML = '';
	} );

	it( 'registers no observer, listener, or timer when the request is not for a single post', () => {
		initializeReadArticle( baseConfig( { isSinglePost: false } ) );

		expect( intersectionObserver.observers ).toHaveLength( 0 );
		expect( windowListenerSpy ).not.toHaveBeenCalled();
		expect( documentListenerSpy ).not.toHaveBeenCalled();
		expect( jest.getTimerCount() ).toBe( 0 );

		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'registers no observer, listener, or timer when the post is not on its last page', () => {
		initializeReadArticle( baseConfig( { isFinalPage: false } ) );

		expect( intersectionObserver.observers ).toHaveLength( 0 );
		expect( windowListenerSpy ).not.toHaveBeenCalled();
		expect( documentListenerSpy ).not.toHaveBeenCalled();
		expect( jest.getTimerCount() ).toBe( 0 );

		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'watches the marker rather than the scroll position when the page has one', () => {
		initializeReadArticle( baseConfig() );

		expect( intersectionObserver.observers ).toHaveLength( 1 );
		expect( intersectionObserver.observers[ 0 ].target ).toBe(
			global.document.querySelector( '.googlesitekit-end-of-content' )
		);
		expect( windowListenerSpy ).not.toHaveBeenCalledWith(
			'scroll',
			expect.anything(),
			expect.anything()
		);
	} );

	it( 'sends the event when the marker is seen and the waiting time is then reached', () => {
		initializeReadArticle( baseConfig() );

		intersectionObserver.simulate( { isIntersecting: true } );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith( 'read_article', {
			post_id: 42,
			word_count: 476,
			estimated_read_time_seconds: 120,
		} );
	} );

	it( 'sends the event when the waiting time is reached and the marker is scrolled into view', () => {
		initializeReadArticle( baseConfig() );

		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		intersectionObserver.simulate( { isIntersecting: true } );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith( 'read_article', {
			post_id: 42,
			word_count: 476,
			estimated_read_time_seconds: 120,
		} );
	} );

	it( 'starts no new timer when the waiting time has already been reached', () => {
		initializeReadArticle( baseConfig() );

		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		// The visitor leaves the window and comes back before reaching the end
		// of the article. That stops the timer and starts it again.
		blurWindow();
		focusWindow();

		expect( jest.getTimerCount() ).toBe( 0 );

		intersectionObserver.simulate( { isIntersecting: true } );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'sends nothing when the marker has never been on screen', () => {
		initializeReadArticle( baseConfig() );

		intersectionObserver.simulate( { isIntersecting: false } );
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();
		expect( intersectionObserver.observers ).toHaveLength( 1 );
	} );

	it( 'stops watching the marker once it has been viewed', () => {
		initializeReadArticle( baseConfig() );

		expect( intersectionObserver.observers ).toHaveLength( 1 );

		intersectionObserver.simulate( { isIntersecting: true } );

		expect( intersectionObserver.observers ).toHaveLength( 0 );
	} );

	it( 'waits 5100 ms for an estimate of 6 seconds', () => {
		initializeReadArticle( baseConfig( { estimatedReadTimeSeconds: 6 } ) );

		intersectionObserver.simulate( { isIntersecting: true } );

		jest.advanceTimersByTime( 5099 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 1 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'never waits less than 5000 ms for an estimate of 3 seconds', () => {
		initializeReadArticle( baseConfig( { estimatedReadTimeSeconds: 3 } ) );

		intersectionObserver.simulate( { isIntersecting: true } );

		jest.advanceTimersByTime( 4999 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 1 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'falls back to the scroll position when the page has no marker', () => {
		renderPostWithoutMarker();
		initializeReadArticle( baseConfig() );

		expect( intersectionObserver.observers ).toHaveLength( 0 );
		expect( windowListenerSpy ).toHaveBeenCalledWith(
			'scroll',
			expect.any( Function ),
			{ passive: true }
		);

		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		scrollPageTo( 0.8 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		scrollPageTo( 0.9 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith( 'read_article', {
			post_id: 42,
			word_count: 476,
			estimated_read_time_seconds: 120,
		} );
	} );

	it( 'falls back to the scroll depth when the browser has no `IntersectionObserver`', () => {
		// The page carries the marker, but a browser with no
		// `IntersectionObserver` can't watch it.
		delete ( global as { IntersectionObserver?: unknown } )
			.IntersectionObserver;

		initializeReadArticle( baseConfig() );

		expect( windowListenerSpy ).toHaveBeenCalledWith(
			'scroll',
			expect.any( Function ),
			{ passive: true }
		);

		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		scrollPageTo( 1 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'counts a page already scrolled to the bottom as reaching the end of the article', () => {
		renderPostWithoutMarker();
		placePageAt( 1 );

		initializeReadArticle( baseConfig() );

		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'counts no time towards the waiting time when the page is hidden', () => {
		initializeReadArticle( baseConfig() );

		intersectionObserver.simulate( { isIntersecting: true } );

		jest.advanceTimersByTime( 50000 );

		hidePage();
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		showPage();
		jest.advanceTimersByTime( 51999 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 1 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'counts no time towards the waiting time when the window is in the background', () => {
		initializeReadArticle( baseConfig() );

		intersectionObserver.simulate( { isIntersecting: true } );

		jest.advanceTimersByTime( 50000 );

		blurWindow();
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		focusWindow();
		jest.advanceTimersByTime( 51999 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 1 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'adds up the waiting time over several periods of reading', () => {
		initializeReadArticle( baseConfig() );

		intersectionObserver.simulate( { isIntersecting: true } );

		// Three periods of reading add up to the 102 seconds required, with the
		// page hidden between them.
		jest.advanceTimersByTime( 34000 );
		hidePage();
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );
		showPage();

		jest.advanceTimersByTime( 34000 );
		hidePage();
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );
		showPage();

		jest.advanceTimersByTime( 33999 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 1 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'waits 50000 ms for 50% of a 100-second estimate', () => {
		initializeReadArticle(
			baseConfig( {
				estimatedReadTimeSeconds: 100,
				readTimeThresholdPercent: 50,
			} )
		);

		intersectionObserver.simulate( { isIntersecting: true } );

		jest.advanceTimersByTime( 49999 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 1 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'waits 20000 ms when the shortest wait is 20 seconds', () => {
		initializeReadArticle(
			baseConfig( {
				estimatedReadTimeSeconds: 1,
				minimumReadTimeSeconds: 20,
			} )
		);

		intersectionObserver.simulate( { isIntersecting: true } );

		jest.advanceTimersByTime( 19999 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 1 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps counting when the window loses the focus and the document keeps it', () => {
		initializeReadArticle( baseConfig() );

		intersectionObserver.simulate( { isIntersecting: true } );

		jest.advanceTimersByTime( 50000 );

		// This fires `blur` while the document keeps the focus, the way an
		// embedded player taking the focus does.
		global.dispatchEvent( new Event( 'blur' ) );

		jest.advanceTimersByTime( 52000 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'starts no waiting time when the page is hidden on load', () => {
		markPageHidden();

		initializeReadArticle( baseConfig() );

		expect( jest.getTimerCount() ).toBe( 0 );

		intersectionObserver.simulate( { isIntersecting: true } );
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		showPage();
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'starts no waiting time when the window is in the background on load', () => {
		hasFocus = false;

		initializeReadArticle( baseConfig() );

		expect( jest.getTimerCount() ).toBe( 0 );

		intersectionObserver.simulate( { isIntersecting: true } );
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		focusWindow();
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the waiting time stopped when the page is shown again and the window is still in the background', () => {
		initializeReadArticle( baseConfig() );

		intersectionObserver.simulate( { isIntersecting: true } );

		blurWindow();

		hidePage();
		showPage();

		expect( jest.getTimerCount() ).toBe( 0 );

		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'sends nothing more when the visitor scrolls again after the event has been sent', () => {
		renderPostWithoutMarker();
		placePageAt( 1 );

		initializeReadArticle( baseConfig() );

		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );

		scrollPageTo( 0.2 );
		scrollPageTo( 1 );
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not send another "read_article" event once the "read_article" event has been sent', () => {
		initializeReadArticle( baseConfig() );

		intersectionObserver.simulate( { isIntersecting: true } );
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );

		intersectionObserver.simulate( { isIntersecting: true } );
		hidePage();
		showPage();
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'removes the observer, the timer, and the listeners when the "read_article" event has been sent', () => {
		initializeReadArticle( baseConfig() );

		intersectionObserver.simulate( { isIntersecting: true } );
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( intersectionObserver.observers ).toHaveLength( 0 );
		expect( jest.getTimerCount() ).toBe( 0 );

		expect( windowRemovalSpy ).toHaveBeenCalledWith(
			'scroll',
			expect.any( Function )
		);
		expect( windowRemovalSpy ).toHaveBeenCalledWith(
			'blur',
			expect.any( Function )
		);
		expect( windowRemovalSpy ).toHaveBeenCalledWith(
			'focus',
			expect.any( Function )
		);
		expect( documentRemovalSpy ).toHaveBeenCalledWith(
			'visibilitychange',
			expect.any( Function )
		);
	} );

	it( 'reports the failure and removes the observer, the timer, and the listeners when sending the "read_article" event encounters an error', () => {
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		gtagEventMock.mockImplementation( () => {
			throw new Error( 'boom' );
		} );

		initializeReadArticle( baseConfig() );

		intersectionObserver.simulate( { isIntersecting: true } );
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( consoleErrorSpy ).toHaveBeenCalledWith(
			'Site Kit: failed to send the read article event.',
			expect.any( Error )
		);
		expect( intersectionObserver.observers ).toHaveLength( 0 );
		expect( jest.getTimerCount() ).toBe( 0 );

		expect( windowRemovalSpy ).toHaveBeenCalledWith(
			'scroll',
			expect.any( Function )
		);
		expect( windowRemovalSpy ).toHaveBeenCalledWith(
			'blur',
			expect.any( Function )
		);
		expect( windowRemovalSpy ).toHaveBeenCalledWith(
			'focus',
			expect.any( Function )
		);
		expect( documentRemovalSpy ).toHaveBeenCalledWith(
			'visibilitychange',
			expect.any( Function )
		);

		consoleErrorSpy.mockRestore();
	} );
} );

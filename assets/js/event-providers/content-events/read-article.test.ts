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
import { initializeReadArticleEventTracker } from './read-article';

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
 * @since 1.189.0
 *
 * @param {Object} overrides Fields to write over the default ones.
 * @return {ContentEventsConfig} Content events configuration.
 */
function baseConfig(
	overrides: Partial< ContentEventsConfig > = {}
): ContentEventsConfig {
	return {
		postID: 42,
		isReadableSinglePost: true,
		hasVimeoEmbed: false,
		wordCount: 476,
		estimatedReadTimeSeconds: 120,
		isLastPageOfMultiPagePost: true,
		readTimeThresholdPercent: 85,
		minimumReadTimeSeconds: 5,
		...overrides,
	};
}

describe( 'initializeReadArticleEventTracker', () => {
	let gtagEventMock: jest.Mock;
	let windowListenerSpy: jest.SpyInstance;
	let documentListenerSpy: jest.SpyInstance;
	let windowRemovalSpy: jest.SpyInstance;
	let documentRemovalSpy: jest.SpyInstance;
	/** Whether the document has the focus, which the `hasFocus` spy returns. */
	let mockHasFocusValue: boolean;

	/**
	 * Makes an element report one box from `getClientRects()`, as an element
	 * does once a browser lays it out.
	 *
	 * jsdom lays out no element, so every element reports no box until a test
	 * lays it out.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Element|null} element The element to lay out.
	 * @return {void}
	 */
	function layOut( element: Element | null ): void {
		jest.spyOn( element as Element, 'getClientRects' ).mockReturnValue( {
			length: 1,
		} as DOMRectList );
	}

	/**
	 * Sends the observer the entry `IntersectionObserver` sends after a scroll
	 * moves an element's bottom edge.
	 *
	 * The observer checks the element against the area below the 800px window,
	 * from 800px down to 1000800px. `IntersectionObserver` counts an element
	 * that touches the area as intersecting it.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Element|null} element The element the observer watches.
	 * @param {number}       bottom  The distance from the top of the window to the element's bottom edge, in pixels.
	 * @return {void}
	 */
	function scrollElementTo( element: Element | null, bottom: number ): void {
		intersectionObserver.simulate( {
			target: element as Element,
			isIntersecting: bottom >= 800,
			boundingClientRect: { top: bottom - 20, bottom } as DOMRectReadOnly,
			rootBounds: { top: 800, bottom: 1000800 } as DOMRectReadOnly,
		} );
	}

	/**
	 * Gets the last `<p>` inside the `<article>` on the page, or `null` when the
	 * article has none.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Element|null} The last paragraph.
	 */
	function lastParagraph(): Element | null {
		return global.document.querySelector( 'article p:last-of-type' );
	}

	/**
	 * Renders a post whose content ends with the end-of-content marker
	 * `Content_Events.php` appends, followed by share buttons.
	 *
	 * @since 1.189.0
	 *
	 * @return {void}
	 */
	function renderPostWithMarker(): void {
		global.document.body.innerHTML =
			'<article><p>First paragraph.</p><p>Last paragraph.</p><!--[googlesitekit-end-of-content]--><div class="share-buttons">Share</div></article>';

		layOut( lastParagraph() );
	}

	/**
	 * Renders a post whose content has no marker, the way a page builder
	 * does.
	 *
	 * @since 1.189.0
	 *
	 * @return {void}
	 */
	function renderPostWithoutMarker(): void {
		global.document.body.innerHTML = '<article>Post content.</article>';
	}

	/**
	 * Sets how far the page has scrolled, without firing the `scroll` event.
	 *
	 * @since 1.189.0
	 *
	 * @param {number} scrollRatio How much of the page the visitor has seen.
	 *                             `0.2` is the top and `1` is the bottom.
	 * @return {void}
	 */
	function placePageAt( scrollRatio: number ): void {
		Object.defineProperty( global, 'scrollY', {
			configurable: true,
			value: scrollRatio * SCROLL_HEIGHT - VIEWPORT_HEIGHT,
		} );
	}

	/**
	 * Sets how far the page has scrolled, then fires the `scroll` event.
	 *
	 * @since 1.189.0
	 *
	 * @param {number} scrollRatio How much of the page the visitor has seen.
	 *                             `0.2` is the top and `1` is the bottom.
	 * @return {void}
	 */
	function scrollPageTo( scrollRatio: number ): void {
		placePageAt( scrollRatio );
		global.dispatchEvent( new Event( 'scroll' ) );
	}

	/**
	 * Sets whether the page has finished loading, without firing the `load`
	 * event.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} readyState The `document.readyState` value to report, e.g. `'interactive'`.
	 * @return {void}
	 */
	function setReadyState( readyState: DocumentReadyState ): void {
		jest.spyOn( global.document, 'readyState', 'get' ).mockReturnValue(
			readyState
		);
	}

	/**
	 * Marks the page visible, without firing a visibility event.
	 *
	 * @since 1.189.0
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
	 * @since 1.189.0
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
	 * @since 1.189.0
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
	 * @since 1.189.0
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
	 * @since 1.189.0
	 *
	 * @return {void}
	 */
	function blurWindow(): void {
		mockHasFocusValue = false;
		global.dispatchEvent( new Event( 'blur' ) );
	}

	/**
	 * Brings the window back to the front, the way switching back to it does.
	 *
	 * @since 1.189.0
	 *
	 * @return {void}
	 */
	function focusWindow(): void {
		mockHasFocusValue = true;
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

		setReadyState( 'complete' );
		markPageVisible();
		mockHasFocusValue = true;
		jest.spyOn( global.document, 'hasFocus' ).mockImplementation(
			() => mockHasFocusValue
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
		// `initializeReadArticleEventTracker()` removes its own listeners only
		// after it sends the event, and most tests here never send one. A
		// listener left behind reacts to the next test's scrolls and focus
		// changes.
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

	it( 'registers no observer, listener, or timer when the request is not for a single post the visitor can read', () => {
		initializeReadArticleEventTracker(
			baseConfig( { isReadableSinglePost: false } )
		);

		expect( intersectionObserver.observers ).toHaveLength( 0 );
		expect( windowListenerSpy ).not.toHaveBeenCalled();
		expect( documentListenerSpy ).not.toHaveBeenCalled();
		expect( jest.getTimerCount() ).toBe( 0 );

		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'registers no observer, listener, or timer when the post is not on its last page', () => {
		initializeReadArticleEventTracker(
			baseConfig( { isLastPageOfMultiPagePost: false } )
		);

		expect( intersectionObserver.observers ).toHaveLength( 0 );
		expect( windowListenerSpy ).not.toHaveBeenCalled();
		expect( documentListenerSpy ).not.toHaveBeenCalled();
		expect( jest.getTimerCount() ).toBe( 0 );

		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'watches the last paragraph against the area below the window, rather than the scroll position, when the page has an end-of-content marker', () => {
		initializeReadArticleEventTracker( baseConfig() );

		expect( intersectionObserver.observers ).toHaveLength( 1 );
		expect( intersectionObserver.observers[ 0 ].target ).toBe(
			lastParagraph()
		);
		expect( intersectionObserver.observers[ 0 ].options ).toEqual( {
			rootMargin: '-100% 0px 1000000px 0px',
		} );
		expect( windowListenerSpy ).not.toHaveBeenCalledWith(
			'scroll',
			expect.anything(),
			expect.anything()
		);
	} );

	it( 'sends the event when the last paragraph is scrolled into view and the waiting time is then reached', () => {
		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 700 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith( 'read_article', {
			post_id: 42,
			word_count: 476,
			estimated_read_time_seconds: 120,
		} );
	} );

	it( 'sends the event when the waiting time is reached and the last paragraph is then scrolled into view', () => {
		initializeReadArticleEventTracker( baseConfig() );

		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		scrollElementTo( lastParagraph(), 700 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith( 'read_article', {
			post_id: 42,
			word_count: 476,
			estimated_read_time_seconds: 120,
		} );
	} );

	it( 'counts the end of the article as reached when an End key jump takes the last paragraph past the top of the window', () => {
		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 2400 );
		scrollElementTo( lastParagraph(), -500 );
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'sends nothing until the bottom edge of the last paragraph rises above the bottom edge of the window', () => {
		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 800 );
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		scrollElementTo( lastParagraph(), 799 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'sends the event once the last paragraph is scrolled into view, and not before, when a wrapper element scrolls the page', () => {
		initializeReadArticleEventTracker( baseConfig() );

		// The wrapper's `overflow` clips the last paragraph while the paragraph
		// is below the window, so `IntersectionObserver` reports the paragraph
		// as not intersecting the area below the window.
		intersectionObserver.simulate( {
			target: lastParagraph() as Element,
			isIntersecting: false,
			boundingClientRect: { top: 2380, bottom: 2400 } as DOMRectReadOnly,
			rootBounds: { top: 800, bottom: 1000800 } as DOMRectReadOnly,
		} );
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		scrollElementTo( lastParagraph(), 810 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		scrollElementTo( lastParagraph(), 700 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'counts the end of the article as reached when the browser reports the scroll to the end and the scroll back up in one call', () => {
		initializeReadArticleEventTracker( baseConfig() );

		// When the visitor scrolls to the end and back up before the callback
		// runs, `IntersectionObserver` sends an entry for each scroll in one call.
		intersectionObserver.simulate( [
			{
				target: lastParagraph() as Element,
				isIntersecting: false,
				boundingClientRect: {
					top: 680,
					bottom: 700,
				} as DOMRectReadOnly,
				rootBounds: { top: 800, bottom: 1000800 } as DOMRectReadOnly,
			},
			{
				target: lastParagraph() as Element,
				isIntersecting: true,
				boundingClientRect: {
					top: 2380,
					bottom: 2400,
				} as DOMRectReadOnly,
				rootBounds: { top: 800, bottom: 1000800 } as DOMRectReadOnly,
			},
		] );
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'sends nothing when the post shows in a frame from another site', () => {
		initializeReadArticleEventTracker( baseConfig() );

		// `simulate()` replaces a `null` `rootBounds` with the box of
		// `document.body`, so the test calls the observer's callback itself.
		const [ { callback, source } ] = intersectionObserver.observers;
		const entry: Partial< IntersectionObserverEntry > = {
			target: lastParagraph() as Element,
			isIntersecting: false,
			boundingClientRect: { top: -520, bottom: -500 } as DOMRectReadOnly,
			rootBounds: null,
		};

		callback(
			[ entry as IntersectionObserverEntry ],
			source as IntersectionObserver
		);
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'waits for the page to load before it watches the end of the article', () => {
		setReadyState( 'interactive' );

		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 700 );
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		setReadyState( 'complete' );
		global.dispatchEvent( new Event( 'load' ) );

		scrollElementTo( lastParagraph(), 700 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'starts no new timer when the waiting time has already been reached', () => {
		initializeReadArticleEventTracker( baseConfig() );

		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		// The visitor leaves the window and comes back before reaching the end
		// of the article. That stops the timer and starts it again.
		blurWindow();
		focusWindow();

		expect( jest.getTimerCount() ).toBe( 0 );

		scrollElementTo( lastParagraph(), 700 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'sends nothing when the last paragraph has never been scrolled into view', () => {
		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 2400 );
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();
		expect( intersectionObserver.observers ).toHaveLength( 1 );
	} );

	it( 'stops watching the last paragraph once the end of the article has been reached', () => {
		initializeReadArticleEventTracker( baseConfig() );

		expect( intersectionObserver.observers ).toHaveLength( 1 );

		scrollElementTo( lastParagraph(), 700 );

		expect( intersectionObserver.observers ).toHaveLength( 0 );
	} );

	it( 'keeps the end of the article reached when the visitor scrolls back up', () => {
		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 700 );
		scrollElementTo( lastParagraph(), 2400 );
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'finds the end-of-content marker among the other comments on the page', () => {
		global.document.body.innerHTML =
			'<article><!-- wp:paragraph --><p>First paragraph.</p><!-- /wp:paragraph --><p>Last paragraph.</p><!--[googlesitekit-end-of-content]--></article>';
		layOut( lastParagraph() );

		initializeReadArticleEventTracker( baseConfig() );

		expect( intersectionObserver.observers[ 0 ].target ).toBe(
			lastParagraph()
		);
	} );

	it( 'skips a script and a hidden element that come after the last paragraph', () => {
		global.document.body.innerHTML =
			'<article><p>Last paragraph.</p><script>window.lastParagraphScript = true;</script><div hidden>Hidden text.</div><!--[googlesitekit-end-of-content]--></article>';

		// As in a browser, only the last paragraph renders a box.
		layOut( lastParagraph() );

		initializeReadArticleEventTracker( baseConfig() );

		expect( intersectionObserver.observers[ 0 ].target ).toBe(
			lastParagraph()
		);
	} );

	it( 'uses the paragraph around the marker when the post leaves its last paragraph open', () => {
		global.document.body.innerHTML =
			'<article><p>First paragraph.</p><p>Last paragraph.<!--[googlesitekit-end-of-content]--></article>';
		layOut( lastParagraph() );

		initializeReadArticleEventTracker( baseConfig() );

		expect( intersectionObserver.observers[ 0 ].target ).toBe(
			lastParagraph()
		);
	} );

	it( 'uses a closed accordion as the end of an article that ends in one', () => {
		global.document.body.innerHTML =
			'<article><p>First paragraph.</p><div class="wp-block-accordion"><h3>Question</h3><div hidden>Answer.</div></div><!--[googlesitekit-end-of-content]--></article>';
		const accordion = global.document.querySelector(
			'.wp-block-accordion'
		);
		layOut( accordion );

		initializeReadArticleEventTracker( baseConfig() );

		expect( intersectionObserver.observers[ 0 ].target ).toBe( accordion );
	} );

	it( 'uses the Query Loop block as the end of an article that ends in one', () => {
		global.document.body.innerHTML =
			'<article><p>First paragraph.</p><div class="wp-block-query"><ul class="wp-block-post-template"><li><h2>Another post</h2><p>Another post text.</p></li></ul></div><!--[googlesitekit-end-of-content]--></article>';
		const queryLoop = global.document.querySelector( '.wp-block-query' );
		layOut( queryLoop );

		initializeReadArticleEventTracker( baseConfig() );

		expect( intersectionObserver.observers[ 0 ].target ).toBe( queryLoop );
	} );

	it( 'uses the first end-of-content marker when a theme prints the post twice', () => {
		global.document.body.innerHTML =
			'<article id="first"><p>Last paragraph.</p><!--[googlesitekit-end-of-content]--></article><article id="second"><p>Last paragraph.</p><!--[googlesitekit-end-of-content]--></article>';
		const firstParagraph = global.document.querySelector( '#first p' );
		layOut( firstParagraph );

		initializeReadArticleEventTracker( baseConfig() );

		expect( intersectionObserver.observers[ 0 ].target ).toBe(
			firstParagraph
		);
	} );

	it( 'waits 5100 ms for an estimate of 6 seconds', () => {
		initializeReadArticleEventTracker(
			baseConfig( { estimatedReadTimeSeconds: 6 } )
		);

		scrollElementTo( lastParagraph(), 700 );

		jest.advanceTimersByTime( 5099 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 1 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'never waits less than 5000 ms for an estimate of 3 seconds', () => {
		initializeReadArticleEventTracker(
			baseConfig( { estimatedReadTimeSeconds: 3 } )
		);

		scrollElementTo( lastParagraph(), 700 );

		jest.advanceTimersByTime( 4999 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 1 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'falls back to the scroll position when the page has no end-of-content marker', () => {
		renderPostWithoutMarker();
		initializeReadArticleEventTracker( baseConfig() );

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

	it( 'falls back to the scroll position when the browser has no `IntersectionObserver`', () => {
		// The end-of-content marker stays on the page, so the missing
		// `IntersectionObserver` is the only reason to fall back to scrolling.
		delete ( global as { IntersectionObserver?: unknown } )
			.IntersectionObserver;

		initializeReadArticleEventTracker( baseConfig() );

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

		initializeReadArticleEventTracker( baseConfig() );

		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'counts no time towards the waiting time when the page is hidden', () => {
		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 700 );

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
		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 700 );

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
		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 700 );

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
		initializeReadArticleEventTracker(
			baseConfig( {
				estimatedReadTimeSeconds: 100,
				readTimeThresholdPercent: 50,
			} )
		);

		scrollElementTo( lastParagraph(), 700 );

		jest.advanceTimersByTime( 49999 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 1 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'waits 20000 ms when the shortest wait is 20 seconds', () => {
		initializeReadArticleEventTracker(
			baseConfig( {
				estimatedReadTimeSeconds: 1,
				minimumReadTimeSeconds: 20,
			} )
		);

		scrollElementTo( lastParagraph(), 700 );

		jest.advanceTimersByTime( 19999 );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 1 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps counting when the window loses the focus and the document keeps it', () => {
		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 700 );

		jest.advanceTimersByTime( 50000 );

		// This fires `blur` while the document keeps the focus, the way an
		// embedded player taking the focus does.
		global.dispatchEvent( new Event( 'blur' ) );

		jest.advanceTimersByTime( 52000 );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'starts no waiting time when the page is hidden on load', () => {
		markPageHidden();

		initializeReadArticleEventTracker( baseConfig() );

		expect( jest.getTimerCount() ).toBe( 0 );

		scrollElementTo( lastParagraph(), 700 );
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		showPage();
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'starts no waiting time when the window is in the background on load', () => {
		mockHasFocusValue = false;

		initializeReadArticleEventTracker( baseConfig() );

		expect( jest.getTimerCount() ).toBe( 0 );

		scrollElementTo( lastParagraph(), 700 );
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();

		focusWindow();
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the waiting time stopped when the page is shown again and the window is still in the background', () => {
		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 700 );

		blurWindow();

		hidePage();
		showPage();

		expect( jest.getTimerCount() ).toBe( 0 );

		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'does not send another "read_article" event when the visitor scrolls to the end again', () => {
		renderPostWithoutMarker();
		placePageAt( 1 );

		initializeReadArticleEventTracker( baseConfig() );

		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );

		scrollPageTo( 0.2 );
		scrollPageTo( 1 );
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not send another "read_article" event once the "read_article" event has been sent', () => {
		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 700 );
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );

		scrollElementTo( lastParagraph(), 2400 );
		scrollElementTo( lastParagraph(), 700 );
		hidePage();
		showPage();
		jest.advanceTimersByTime( LONGER_THAN_ANY_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'removes the observer, the timer, and the listeners when the "read_article" event has been sent', () => {
		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 700 );
		jest.advanceTimersByTime( REQUIRED_WAIT_MS );

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
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

		initializeReadArticleEventTracker( baseConfig() );

		scrollElementTo( lastParagraph(), 700 );
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

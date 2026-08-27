/**
 * Pagination click event tracking tests.
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
import { ContentEventsConfig } from '@/js/event-providers/content-events';
import { initializePagination } from './pagination';

type SiteKitGlobal = typeof global._googlesitekit;

const POST_ID = 42;

function baseConfig(
	overrides: Partial< ContentEventsConfig > = {}
): ContentEventsConfig {
	return {
		postID: POST_ID,
		isSinglePost: true,
		hasVimeoEmbed: false,
		...overrides,
	};
}

describe( 'initializePagination', () => {
	let gtagEventMock: jest.Mock;

	/**
	 * Renders markup into the document body and returns the first element.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} markup Markup to render.
	 * @return {Element} The rendered markup's first element.
	 */
	function render< T extends Element = Element >( markup: string ): T {
		global.document.body.innerHTML = markup;

		return global.document.body.firstElementChild as T;
	}

	/**
	 * Stops jsdom from trying to follow the anchors these tests click.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} event The click to swallow.
	 * @return {void}
	 */
	function preventNavigation( event: Event ) {
		event.preventDefault();
	}

	let registeredListeners: Array< [ string, EventListener ] > = [];

	/**
	 * Runs the initializer, recording the listeners it puts on `document`.
	 *
	 * `initializePagination()` has no teardown — in production it is called once
	 * per page load — so without this every test would leave its listener behind
	 * and a later click would be counted once per test that had already run.
	 *
	 * @since n.e.x.t
	 *
	 * @param {ContentEventsConfig} config Content events configuration.
	 * @return {Array} The `[ type, listener ]` pairs this call registered.
	 */
	function initialize(
		config: ContentEventsConfig = baseConfig()
	): Array< [ string, EventListener ] > {
		const addEventListenerSpy = jest.spyOn(
			global.document,
			'addEventListener'
		);

		initializePagination( config );

		const added: Array< [ string, EventListener ] > =
			addEventListenerSpy.mock.calls.map( ( [ type, listener ] ) => [
				type as string,
				listener as EventListener,
			] );

		// Restoring clears the spy's recorded calls, so they are read out first.
		addEventListenerSpy.mockRestore();
		registeredListeners.push( ...added );

		return added;
	}

	beforeEach( () => {
		gtagEventMock = jest.fn();
		global._googlesitekit = { gtagEvent: gtagEventMock };
		global.document.body.innerHTML = '';
		registeredListeners = [];
		global.document.addEventListener( 'click', preventNavigation );
	} );

	afterEach( () => {
		global.document.body.classList.remove( 'single-topic' );
		registeredListeners.forEach( ( [ type, listener ] ) =>
			global.document.removeEventListener( type, listener )
		);
		global.document.removeEventListener( 'click', preventNavigation );
		global.document.body.innerHTML = '';
		delete ( global as { _googlesitekit?: SiteKitGlobal } )._googlesitekit;
	} );

	it( 'emits one event with only the expected payload for a post pagination link', () => {
		const anchor = render< HTMLAnchorElement >(
			'<a class="post-page-numbers" href="https://example.com/my-post/3/">3</a>'
		);
		initialize();

		anchor.click();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith( 'pagination_click', {
			pagination_type: 'post',
			page_number: 3,
			post_id: POST_ID,
			transport_type: 'beacon',
		} );
	} );

	it( 'resolves a click on a child element up to the pagination anchor', () => {
		render(
			'<a class="post-page-numbers" href="https://example.com/my-post/2/"><span class="icon">Next page</span></a>'
		);
		initialize();

		global.document.querySelector( '.icon' )?.dispatchEvent(
			new global.MouseEvent( 'click', {
				bubbles: true,
				cancelable: true,
			} )
		);

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith(
			'pagination_click',
			expect.objectContaining( {
				pagination_type: 'post',
				page_number: 2,
			} )
		);
	} );

	it.each( [
		[
			'the current-page marker',
			'<span class="post-page-numbers current">2</span>',
			'span.post-page-numbers',
		],
		[
			'a non-anchor element',
			'<div class="not-pagination">Read more</div>',
			'div.not-pagination',
		],
		[
			'blog pagination outside a bbPress topic',
			'<a class="page-numbers" href="https://example.com/page/2/">2</a>',
			'a.page-numbers',
		],
		[
			'a next-post link',
			'<a class="next-post" href="https://example.com/other-post/">Next</a>',
			'a.next-post',
		],
	] )( 'emits nothing for %s', ( _label, markup, selector ) => {
		render( markup );
		initialize();

		global.document.querySelector( selector )?.dispatchEvent(
			new global.MouseEvent( 'click', {
				bubbles: true,
				cancelable: true,
			} )
		);

		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'emits the bbpress type for a page link inside a topic’s pagination', () => {
		global.document.body.classList.add( 'single-topic' );
		render(
			'<div class="bbp-pagination-links"><a class="page-numbers" href="https://example.com/my-topic/page/2/">2</a></div>'
		);
		initialize();

		global.document
			.querySelector< HTMLAnchorElement >( '.bbp-pagination-links a' )
			?.click();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 1 );
		expect( gtagEventMock ).toHaveBeenCalledWith( 'pagination_click', {
			pagination_type: 'bbpress',
			page_number: 2,
			post_id: POST_ID,
			transport_type: 'beacon',
		} );
	} );

	it( 'should emit nothing for the bbPress current-page marker', () => {
		// On the topic, so the only reason this is not tracked is that bbPress
		// renders the current page as a span rather than a link.
		global.document.body.classList.add( 'single-topic' );
		render(
			'<div class="bbp-pagination-links"><span class="page-numbers current">1</span></div>'
		);
		initialize();

		global.document
			.querySelector( '.bbp-pagination-links span.current' )
			?.dispatchEvent(
				new global.MouseEvent( 'click', {
					bubbles: true,
					cancelable: true,
				} )
			);

		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'emits nothing for a bbPress pagination link that is not on a topic', () => {
		// bbPress renders this same container for a forum's topic list and for
		// its search results, neither of which is a thread being read.
		render(
			'<div class="bbp-pagination-links"><a class="page-numbers" href="https://example.com/forums/forum/qa/page/2/">2</a></div>'
		);
		initialize();

		global.document
			.querySelector< HTMLAnchorElement >( '.bbp-pagination-links a' )
			?.click();

		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'emits nothing for the same anchor outside the bbPress pagination container', () => {
		const anchor = render< HTMLAnchorElement >(
			'<a class="page-numbers" href="https://example.com/my-topic/page/2/">2</a>'
		);
		initialize();

		anchor.click();

		expect( gtagEventMock ).not.toHaveBeenCalled();
	} );

	it( 'tracks an anchor appended after initialization', () => {
		initialize();

		const anchor = render< HTMLAnchorElement >(
			'<a class="post-page-numbers" href="https://example.com/my-post/5/">5</a>'
		);
		anchor.click();

		expect( gtagEventMock ).toHaveBeenCalledWith(
			'pagination_click',
			expect.objectContaining( { page_number: 5 } )
		);
	} );

	// The text of every href-driven row below is deliberately non-numeric, so a
	// passing row proves the number was read from the address rather than from
	// the link text that would otherwise happen to match.
	it.each( [
		[
			'the page search param',
			'https://example.com/?p=12&page=3',
			'Next page',
			3,
		],
		[
			'the paged search param',
			'https://example.com/my-topic/?paged=4',
			'Next',
			4,
		],
		[
			'a pretty post permalink',
			'https://example.com/my-post/2/',
			'Next page',
			2,
		],
		[
			'a front page path',
			'https://example.com/page/5/',
			'Older posts',
			5,
		],
		[
			'the anchor text when the href carries no number',
			'https://example.com/my-post/',
			'1',
			1,
		],
		[
			'a fallback of 1 when neither href nor text yields one',
			'https://example.com/my-post/',
			'Previous page',
			1,
		],
	] )( 'reads page_number from %s', ( _label, href, text, expected ) => {
		const anchor = render< HTMLAnchorElement >(
			`<a class="post-page-numbers" href="${ href }">${ text }</a>`
		);
		initialize();

		anchor.click();

		expect( gtagEventMock ).toHaveBeenCalledWith(
			'pagination_click',
			expect.objectContaining( { page_number: expected } )
		);
	} );

	it( 'falls back to the anchor text for a link with no href, without logging', () => {
		// Mock console.error so a regression here surfaces as a failed
		// assertion rather than an unexpected log.
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		const anchor = render< HTMLAnchorElement >(
			'<a class="post-page-numbers">3</a>'
		);
		initialize();

		anchor.click();

		expect( gtagEventMock ).toHaveBeenCalledWith(
			'pagination_click',
			expect.objectContaining( { page_number: 3 } )
		);
		expect( consoleErrorSpy ).not.toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	} );

	it( 'registers exactly one document click listener', () => {
		const added = initialize();

		expect( added ).toHaveLength( 1 );
		expect( added[ 0 ][ 0 ] ).toBe( 'click' );
		expect( typeof added[ 0 ][ 1 ] ).toBe( 'function' );
	} );

	it( 'keeps emitting after a click whose handling throws', () => {
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		render(
			'<a class="post-page-numbers" href="https://example.com/my-post/2/">2</a>' +
				'<a class="post-page-numbers" href="https://example.com/my-post/3/">3</a>'
		);
		initialize();

		const [ first, second ] = Array.from(
			global.document.querySelectorAll< HTMLAnchorElement >(
				'a.post-page-numbers'
			)
		);

		gtagEventMock.mockImplementationOnce( () => {
			throw new Error( 'boom' );
		} );

		first.click();
		expect( consoleErrorSpy ).toHaveBeenCalledWith(
			'Site Kit: failed to track this pagination click.',
			expect.any( Error )
		);

		second.click();

		expect( gtagEventMock ).toHaveBeenCalledTimes( 2 );
		expect( gtagEventMock ).toHaveBeenLastCalledWith(
			'pagination_click',
			expect.objectContaining( { page_number: 3 } )
		);

		consoleErrorSpy.mockRestore();
	} );
} );

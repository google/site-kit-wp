/**
 * `useScrollToAdjustingForHeight` hook tests.
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
import * as scrollUtils from '@/js/util/scroll';
import { actHook as act, fireEvent, renderHook } from '@tests/js/test-utils';
import useScrollToAdjustingForHeight from './useScrollToAdjustingForHeight';

describe( 'useScrollToAdjustingForHeight', () => {
	const getNavigationalScrollTopSpy = jest.spyOn(
		scrollUtils,
		'getNavigationalScrollTop'
	);
	const scrollToSpy = jest.spyOn( global, 'scrollTo' );

	// Keeps each observer's callback and the element it watches from its
	// `observe()` until its `disconnect()`, because a browser calls no
	// callback after a `disconnect()`.
	let connectedObservers: Map<
		ResizeObserver,
		{ callback: ResizeObserverCallback; target: Element }
	>;
	let page: Element;
	let element: Element;

	/**
	 * Stands in for ResizeObserver, which JSDOM lacks.
	 *
	 * @since n.e.x.t
	 */
	class ResizeObserverMock implements ResizeObserver {
		callback: ResizeObserverCallback;

		constructor( callback: ResizeObserverCallback ) {
			this.callback = callback;
		}

		observe( target: Element ) {
			connectedObservers.set( this, { callback: this.callback, target } );
		}

		unobserve = jest.fn();

		disconnect() {
			connectedObservers.delete( this );
		}
	}

	/**
	 * Calls the callback of each connected observer of the
	 * `.googlesitekit-page` element, as a browser does when the page changes
	 * height.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function changePageHeight() {
		connectedObservers.forEach( ( { callback, target }, observer ) => {
			if ( target === page ) {
				callback( [], observer );
			}
		} );
	}

	/**
	 * Renders the hook, and calls the function it returns with the selector of
	 * the test element.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} The result of `renderHook()`.
	 */
	function renderAndScroll() {
		const rendered = renderHook( () => useScrollToAdjustingForHeight() );

		act( () => {
			rendered.result.current( '#googlesitekit-test-element' );
		} );

		return rendered;
	}

	beforeEach( () => {
		jest.useFakeTimers();

		global.ResizeObserver = ResizeObserverMock;
		connectedObservers = new Map();

		page = document.createElement( 'div' );
		page.className = 'googlesitekit-page';
		element = document.createElement( 'div' );
		element.id = 'googlesitekit-test-element';
		page.appendChild( element );
		document.body.appendChild( page );

		getNavigationalScrollTopSpy.mockReturnValue( 100 );
		scrollToSpy.mockClear();
	} );

	afterEach( () => {
		page.remove();
		element.remove();
		Object.defineProperty( global, 'scrollY', {
			value: 0,
			configurable: true,
		} );
	} );

	it( 'should scroll the page smoothly to the element', () => {
		renderAndScroll();

		expect( getNavigationalScrollTopSpy ).toHaveBeenCalledWith(
			'#googlesitekit-test-element',
			'desktop'
		);
		expect( scrollToSpy ).toHaveBeenCalledTimes( 1 );
		expect( scrollToSpy ).toHaveBeenCalledWith( {
			top: 100,
			behavior: 'smooth',
		} );
	} );

	it.each( [
		[ 'down', 102 ],
		[ 'up', 40 ],
	] )(
		"should scroll to the element's new position when the page changes height and the element moved %s",
		( _direction, newTop ) => {
			renderAndScroll();

			getNavigationalScrollTopSpy.mockReturnValue( newTop );
			changePageHeight();

			expect( getNavigationalScrollTopSpy ).toHaveBeenLastCalledWith(
				'#googlesitekit-test-element',
				'desktop'
			);
			expect( scrollToSpy ).toHaveBeenCalledTimes( 2 );
			expect( scrollToSpy ).toHaveBeenLastCalledWith( {
				top: newTop,
				behavior: 'smooth',
			} );
		}
	);

	it( 'should scroll once for each change of height after a second call', () => {
		const { result } = renderAndScroll();

		act( () => {
			result.current( '#googlesitekit-test-element' );
		} );
		getNavigationalScrollTopSpy.mockReturnValue( 250 );
		changePageHeight();

		expect( connectedObservers.size ).toBe( 1 );
		expect( scrollToSpy ).toHaveBeenCalledTimes( 3 );
	} );

	it.each( [
		[ 'did not move', 100 ],
		[ 'moved by 1 px', 101 ],
	] )(
		'should not scroll again when the page changes height and the element %s',
		( _description, newTop ) => {
			renderAndScroll();

			getNavigationalScrollTopSpy.mockReturnValue( newTop );
			changePageHeight();

			expect( scrollToSpy ).toHaveBeenCalledTimes( 1 );
		}
	);

	it( 'should not scroll again while the element stays at the position the page last scrolled to', () => {
		renderAndScroll();

		getNavigationalScrollTopSpy.mockReturnValue( 150 );
		changePageHeight();
		// The element stays at its new position.
		changePageHeight();

		expect( scrollToSpy ).toHaveBeenCalledTimes( 2 );
		expect( scrollToSpy ).toHaveBeenLastCalledWith( {
			top: 150,
			behavior: 'smooth',
		} );
	} );

	it( 'should end its smooth scroll where the mouse wheel turn takes the page, and scroll no more, after a `wheel` event', () => {
		renderAndScroll();

		// The page is part of the way to the element.
		Object.defineProperty( global, 'scrollY', {
			value: 60,
			configurable: true,
		} );
		fireEvent.wheel( window, { deltaY: -40 } );
		getNavigationalScrollTopSpy.mockReturnValue( 250 );
		changePageHeight();

		expect( scrollToSpy ).toHaveBeenCalledTimes( 2 );
		expect( scrollToSpy ).toHaveBeenLastCalledWith( {
			top: 20,
			behavior: 'instant',
		} );
	} );

	it.each( [
		[ 'a `pointerdown` event', () => fireEvent.pointerDown( window ) ],
		[
			'a `keydown` event',
			() => fireEvent.keyDown( window, { key: 'Tab' } ),
		],
		[
			'a `wheel` event with `Ctrl` pressed',
			() => fireEvent.wheel( window, { deltaY: -40, ctrlKey: true } ),
		],
	] )(
		'should end its smooth scroll where the page is, and scroll no more, after %s',
		( _event, fireUserEvent ) => {
			renderAndScroll();

			// The page is part of the way to the element.
			Object.defineProperty( global, 'scrollY', {
				value: 60,
				configurable: true,
			} );
			fireUserEvent();
			getNavigationalScrollTopSpy.mockReturnValue( 250 );
			changePageHeight();

			expect( scrollToSpy ).toHaveBeenCalledTimes( 2 );
			expect( scrollToSpy ).toHaveBeenLastCalledWith( {
				top: 60,
				behavior: 'instant',
			} );
		}
	);

	it.each( [
		[ 'a `pointerdown`', () => fireEvent.pointerDown( window ) ],
		[ 'a `keydown`', () => fireEvent.keyDown( window, { key: 'Enter' } ) ],
	] )(
		"should scroll nothing on %s event just before the call, and still scroll to the element's new position after it",
		( _event, fireUserEvent ) => {
			const { result } = renderHook( () =>
				useScrollToAdjustingForHeight()
			);

			fireUserEvent();

			expect( scrollToSpy ).not.toHaveBeenCalled();

			act( () => {
				result.current( '#googlesitekit-test-element' );
			} );
			getNavigationalScrollTopSpy.mockReturnValue( 250 );
			changePageHeight();

			expect( scrollToSpy ).toHaveBeenCalledTimes( 2 );
			expect( scrollToSpy ).toHaveBeenLastCalledWith( {
				top: 250,
				behavior: 'smooth',
			} );
		}
	);

	it( 'should keep the element in place until 30 seconds after the call, and no longer', () => {
		const { result } = renderHook( () => useScrollToAdjustingForHeight() );

		act( () => {
			jest.advanceTimersByTime( 10000 );
		} );
		act( () => {
			result.current( '#googlesitekit-test-element' );
		} );
		act( () => {
			jest.advanceTimersByTime( 29999 );
		} );
		getNavigationalScrollTopSpy.mockReturnValue( 150 );
		changePageHeight();

		expect( scrollToSpy ).toHaveBeenCalledTimes( 2 );

		act( () => {
			jest.advanceTimersByTime( 1 );
		} );
		getNavigationalScrollTopSpy.mockReturnValue( 200 );
		changePageHeight();

		expect( scrollToSpy ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should not scroll after the component unmounts', () => {
		const { unmount } = renderAndScroll();

		unmount();
		getNavigationalScrollTopSpy.mockReturnValue( 250 );
		changePageHeight();

		expect( scrollToSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not scroll the page when the selector matches no element', () => {
		element.remove();

		renderAndScroll();

		expect( scrollToSpy ).not.toHaveBeenCalled();
		expect( connectedObservers.size ).toBe( 0 );
	} );

	it( 'should not scroll the page to its top after the element leaves the page', () => {
		renderAndScroll();

		element.remove();
		// `getNavigationalScrollTop()` gives 0 for an element that is gone.
		getNavigationalScrollTopSpy.mockReturnValue( 0 );
		changePageHeight();

		expect( scrollToSpy ).toHaveBeenCalledTimes( 1 );
		expect( connectedObservers.size ).toBe( 0 );
	} );

	it( 'should scroll to the element once, and not keep it in place, when the screen has no `.googlesitekit-page` element', () => {
		page.remove();
		document.body.appendChild( element );

		renderAndScroll();

		expect( scrollToSpy ).toHaveBeenCalledTimes( 1 );
		expect( connectedObservers.size ).toBe( 0 );
	} );
} );

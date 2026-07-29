/**
 * ScrollableTabs component tests.
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
import {
	BREAKPOINT_DESKTOP,
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	BREAKPOINT_XLARGE,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import { act, fireEvent, render } from '@tests/js/test-utils';
import ScrollableTabs, { ScrollableTabsProps } from './ScrollableTabs';

jest.mock( '@/js/hooks/useBreakpoint', () => ( {
	...jest.requireActual( '@/js/hooks/useBreakpoint' ),
	useBreakpoint: jest.fn(),
} ) );

describe( 'ScrollableTabs', () => {
	const LEFT_ARROW_LABEL = 'Scroll tabs left';
	const RIGHT_ARROW_LABEL = 'Scroll tabs right';

	const observeMock = jest.fn();
	const disconnectMock = jest.fn();
	const resizeObserverConstructedMock = jest.fn();
	let resizeObserverCallback: ResizeObserverCallback | undefined;

	/**
	 * Stands in for ResizeObserver, which JSDOM lacks. Captures the observer
	 * callback and routes the instance methods to the shared mocks, so tests
	 * can fire size changes and check what the component observes.
	 *
	 * @since n.e.x.t
	 */
	class ResizeObserverMock implements ResizeObserver {
		constructor( callback: ResizeObserverCallback ) {
			resizeObserverConstructedMock();
			resizeObserverCallback = callback;
		}

		observe = observeMock;
		unobserve = jest.fn();
		disconnect = disconnectMock;
	}

	/**
	 * The DOM that `@material/react-tab-scroller` renders inside a `TabBar`,
	 * down to the `.mdc-tab-scroller__scroll-area` node the component resolves
	 * by default and reads its scroll metrics from.
	 */
	const mockTabBar = (
		<div className="mdc-tab-bar">
			<div className="mdc-tab-scroller">
				<div className="mdc-tab-scroller__scroll-area">
					<div className="mdc-tab-scroller__scroll-content">Tabs</div>
				</div>
			</div>
		</div>
	);

	/**
	 * Renders ScrollableTabs around a mock MDC tab bar structure.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} props The extra props to pass to the component.
	 * @return {Object} The render result.
	 */
	function renderTabs( props: Partial< ScrollableTabsProps > = {} ) {
		return render(
			<ScrollableTabs { ...props }>{ mockTabBar }</ScrollableTabs>
		);
	}

	/**
	 * Gets the MDC scroll area from a rendered container.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Element} container The rendered container element.
	 * @return {Element} The MDC scroll area element.
	 */
	function getScrollArea( container: Element ) {
		return container.querySelector(
			'.mdc-tab-scroller__scroll-area'
		) as Element;
	}

	/**
	 * Sets the scroll metrics on an element, since JSDOM computes no layout.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Element} element             The element to define the metrics on.
	 * @param {Object}  metrics             The metrics to define.
	 * @param {number}  metrics.scrollLeft  The scroll position to report.
	 * @param {number}  metrics.clientWidth The visible width to report.
	 * @param {number}  metrics.scrollWidth The content width to report.
	 * @return {void}
	 */
	function setScrollMetrics(
		element: Element,
		{
			scrollLeft,
			clientWidth,
			scrollWidth,
		}: { scrollLeft: number; clientWidth: number; scrollWidth: number }
	) {
		Object.defineProperty( element, 'scrollLeft', {
			configurable: true,
			writable: true,
			value: scrollLeft,
		} );
		Object.defineProperty( element, 'clientWidth', {
			configurable: true,
			value: clientWidth,
		} );
		Object.defineProperty( element, 'scrollWidth', {
			configurable: true,
			value: scrollWidth,
		} );
	}

	/**
	 * Asserts that an arrow offers a scroll, so it reads as active and sits in
	 * the tab order.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Element} arrow The arrow button to check.
	 * @return {void}
	 */
	function expectActive( arrow: Element ) {
		expect( arrow ).toHaveAttribute( 'aria-disabled', 'false' );
		expect( arrow ).not.toHaveClass(
			'googlesitekit-scrollable-tabs__arrow--inactive'
		);
		expect( arrow ).toHaveAttribute( 'tabindex', '0' );
	}

	/**
	 * Asserts that an arrow has nothing left to scroll, so it stays in the
	 * page, reads as inactive, and leaves the tab order.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Element} arrow The arrow button to check.
	 * @return {void}
	 */
	function expectInactive( arrow: Element ) {
		expect( arrow ).toBeInTheDocument();
		expect( arrow ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( arrow ).toHaveClass(
			'googlesitekit-scrollable-tabs__arrow--inactive'
		);
		expect( arrow ).toHaveAttribute( 'tabindex', '-1' );
	}

	beforeEach( () => {
		jest.clearAllMocks();

		resizeObserverCallback = undefined;

		global.ResizeObserver = ResizeObserverMock;

		// The component updates its scroll state in a requestAnimationFrame callback, so run each scheduled frame synchronously.
		jest.spyOn( global, 'requestAnimationFrame' ).mockImplementation(
			( callback ) => {
				callback( 0 );
				return 0;
			}
		);

		( useBreakpoint as jest.Mock ).mockReturnValue( BREAKPOINT_DESKTOP );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'renders its children and merges the provided class name', () => {
		const { container } = renderTabs( { className: 'custom-class' } );

		const wrapper = container.firstElementChild;

		expect( wrapper ).toHaveClass( 'googlesitekit-scrollable-tabs' );
		expect( wrapper ).toHaveClass( 'custom-class' );
		expect( container.querySelector( '.mdc-tab-bar' ) ).toBeInTheDocument();
	} );

	it.each( [ BREAKPOINT_DESKTOP, BREAKPOINT_XLARGE ] )(
		'shows only the right arrow at the %s breakpoint when the bar overflows at the start',
		( breakpoint ) => {
			( useBreakpoint as jest.Mock ).mockReturnValue( breakpoint );

			const { container, getByRole } = renderTabs();
			const scrollArea = getScrollArea( container );

			setScrollMetrics( scrollArea, {
				scrollLeft: 0,
				clientWidth: 400,
				scrollWidth: 800,
			} );
			fireEvent.scroll( scrollArea );

			expectActive( getByRole( 'button', { name: RIGHT_ARROW_LABEL } ) );
			expectInactive( getByRole( 'button', { name: LEFT_ARROW_LABEL } ) );
		}
	);

	it( 'shows both arrows when the bar can scroll in both directions', () => {
		const { container, getByRole } = renderTabs();
		const scrollArea = getScrollArea( container );

		setScrollMetrics( scrollArea, {
			scrollLeft: 200,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		expectActive( getByRole( 'button', { name: LEFT_ARROW_LABEL } ) );
		expectActive( getByRole( 'button', { name: RIGHT_ARROW_LABEL } ) );
	} );

	it( 'shows only the left arrow when the bar is scrolled to the end', () => {
		const { container, getByRole } = renderTabs();
		const scrollArea = getScrollArea( container );

		setScrollMetrics( scrollArea, {
			scrollLeft: 400,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		expectActive( getByRole( 'button', { name: LEFT_ARROW_LABEL } ) );
		expectInactive( getByRole( 'button', { name: RIGHT_ARROW_LABEL } ) );
	} );

	it( 'shows no arrows when all tabs fit', () => {
		const { container, getByRole } = renderTabs();
		const scrollArea = getScrollArea( container );

		setScrollMetrics( scrollArea, {
			scrollLeft: 0,
			clientWidth: 800,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		expectInactive( getByRole( 'button', { name: LEFT_ARROW_LABEL } ) );
		expectInactive( getByRole( 'button', { name: RIGHT_ARROW_LABEL } ) );
	} );

	it( 'keeps focus on the arrow that runs out of scroll', () => {
		const { container, getByRole } = renderTabs();
		const scrollArea = getScrollArea( container );

		setScrollMetrics( scrollArea, {
			scrollLeft: 200,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		const rightArrow = getByRole( 'button', { name: RIGHT_ARROW_LABEL } );
		rightArrow.focus();
		expect( rightArrow.ownerDocument.activeElement ).toBe( rightArrow );

		// Reaching the end of the bar leaves the arrow with nothing to scroll.
		setScrollMetrics( scrollArea, {
			scrollLeft: 400,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		expectInactive( rightArrow );
		expect( rightArrow.ownerDocument.activeElement ).toBe( rightArrow );
	} );

	it( 'does not scroll the bar when an arrow with nothing to scroll is activated', () => {
		const { container, getByRole } = renderTabs();
		const scrollArea = getScrollArea( container );
		const scrollByMock = jest.fn();
		scrollArea.scrollBy = scrollByMock;

		setScrollMetrics( scrollArea, {
			scrollLeft: 0,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		fireEvent.click( getByRole( 'button', { name: LEFT_ARROW_LABEL } ) );

		expect( scrollByMock ).not.toHaveBeenCalled();
	} );

	it( 'updates the arrows when the container or tab set changes size', () => {
		const { container, getByRole } = renderTabs();
		const scrollArea = getScrollArea( container );
		const scrollContent = container.querySelector(
			'.mdc-tab-scroller__scroll-content'
		);

		expect( observeMock ).toHaveBeenCalledWith( scrollArea );
		expect( observeMock ).toHaveBeenCalledWith( scrollContent );

		setScrollMetrics( scrollArea, {
			scrollLeft: 0,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		act( () => {
			resizeObserverCallback?.( [], {} as ResizeObserver );
		} );

		expectActive( getByRole( 'button', { name: RIGHT_ARROW_LABEL } ) );
	} );

	it( 'scrolls the bar forward when the right arrow is clicked', () => {
		const { container, getByRole } = renderTabs();
		const scrollArea = getScrollArea( container );
		const scrollByMock = jest.fn();
		scrollArea.scrollBy = scrollByMock;

		setScrollMetrics( scrollArea, {
			scrollLeft: 0,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		fireEvent.click( getByRole( 'button', { name: RIGHT_ARROW_LABEL } ) );

		expect( scrollByMock ).toHaveBeenCalledWith( {
			left: 320,
			behavior: 'smooth',
		} );
	} );

	it( 'scrolls the bar backward when the left arrow is clicked', () => {
		const { container, getByRole } = renderTabs();
		const scrollArea = getScrollArea( container );
		const scrollByMock = jest.fn();
		scrollArea.scrollBy = scrollByMock;

		setScrollMetrics( scrollArea, {
			scrollLeft: 200,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		fireEvent.click( getByRole( 'button', { name: LEFT_ARROW_LABEL } ) );

		expect( scrollByMock ).toHaveBeenCalledWith( {
			left: -320,
			behavior: 'smooth',
		} );
	} );

	it.each( [ BREAKPOINT_SMALL, BREAKPOINT_TABLET ] )(
		'shows no arrows at the %s breakpoint even when the bar overflows',
		( breakpoint ) => {
			( useBreakpoint as jest.Mock ).mockReturnValue( breakpoint );

			const { container, queryByRole } = renderTabs();
			const scrollArea = getScrollArea( container );

			setScrollMetrics( scrollArea, {
				scrollLeft: 200,
				clientWidth: 400,
				scrollWidth: 800,
			} );
			fireEvent.scroll( scrollArea );

			expect(
				queryByRole( 'button', { name: LEFT_ARROW_LABEL } )
			).not.toBeInTheDocument();
			expect(
				queryByRole( 'button', { name: RIGHT_ARROW_LABEL } )
			).not.toBeInTheDocument();
			expect( resizeObserverConstructedMock ).not.toHaveBeenCalled();
		}
	);

	it( 'shows the right arrow once the window widens to a desktop width', () => {
		( useBreakpoint as jest.Mock ).mockReturnValue( BREAKPOINT_TABLET );

		const { container, getByRole, queryByRole, rerender } = renderTabs();
		const scrollArea = getScrollArea( container );

		setScrollMetrics( scrollArea, {
			scrollLeft: 0,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		expect(
			queryByRole( 'button', { name: RIGHT_ARROW_LABEL } )
		).not.toBeInTheDocument();

		( useBreakpoint as jest.Mock ).mockReturnValue( BREAKPOINT_DESKTOP );
		rerender( <ScrollableTabs>{ mockTabBar }</ScrollableTabs> );

		expectActive( getByRole( 'button', { name: RIGHT_ARROW_LABEL } ) );
	} );

	it( 'stops listening for scroll and size changes on unmount', () => {
		const { container, unmount } = renderTabs();
		const scrollArea = getScrollArea( container );
		const removeEventListenerSpy = jest.spyOn(
			scrollArea,
			'removeEventListener'
		);

		unmount();

		expect( removeEventListenerSpy ).toHaveBeenCalledWith(
			'scroll',
			expect.any( Function )
		);
		expect( disconnectMock ).toHaveBeenCalled();
	} );

	it( 'shows arrows when the container itself is the overflowing element', () => {
		const { container, getByRole } = render(
			<ScrollableTabs>
				<div>Tabs</div>
			</ScrollableTabs>
		);
		const wrapper = container.firstElementChild as Element;

		setScrollMetrics( wrapper, {
			scrollLeft: 0,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( wrapper );

		expectActive( getByRole( 'button', { name: RIGHT_ARROW_LABEL } ) );
	} );

	it( 'shows arrows for a scroll target named by a custom selector', () => {
		const { container, getByRole } = render(
			<ScrollableTabs scrollTargetSelector=".custom-scroller">
				<div className="custom-scroller">
					<div>Tabs</div>
				</div>
			</ScrollableTabs>
		);
		const scroller = container.querySelector(
			'.custom-scroller'
		) as Element;

		setScrollMetrics( scroller, {
			scrollLeft: 0,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scroller );

		expectActive( getByRole( 'button', { name: RIGHT_ARROW_LABEL } ) );
	} );
} );

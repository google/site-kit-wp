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
	const LEFT_ARROW_SELECTOR = '.googlesitekit-scrollable-tabs__arrow--left';
	const RIGHT_ARROW_SELECTOR = '.googlesitekit-scrollable-tabs__arrow--right';
	const INACTIVE_ARROW_CLASS =
		'googlesitekit-scrollable-tabs__arrow--inactive';

	const observeMock = jest.fn();
	const disconnectMock = jest.fn();
	const resizeObserverConstructedMock = jest.fn();
	let resizeObserverCallback: ResizeObserverCallback | undefined;

	/**
	 * Stands in for ResizeObserver, which JSDOM lacks. Captures the observer
	 * callback and routes the instance methods to the shared mocks, so tests
	 * can fire size changes and check what the component observes.
	 *
	 * @since 1.185.0
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
	 * @since 1.185.0
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
	 * @since 1.185.0
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
	 * Gets an arrow button from a rendered container.
	 *
	 * @since 1.185.0
	 *
	 * @param {Element} container The rendered container element.
	 * @param {string}  selector  The class selector for the arrow to get.
	 * @return {Element|null} The arrow button, or `null` when it isn't rendered.
	 */
	function getArrow( container: Element, selector: string ) {
		return container.querySelector( selector );
	}

	/**
	 * Sets the scroll metrics on an element, since JSDOM computes no layout.
	 *
	 * @since 1.185.0
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
	 * Asserts that an arrow with more to scroll stays in the page, takes a
	 * click, and holds no `--inactive` class.
	 *
	 * @since 1.185.0
	 *
	 * @param {Element|null} arrow The arrow button to check.
	 * @return {void}
	 */
	function expectActive( arrow: Element | null ) {
		expect( arrow ).toBeInTheDocument();
		expect( arrow ).toBeEnabled();
		expect( arrow ).not.toHaveClass( INACTIVE_ARROW_CLASS );
	}

	/**
	 * Asserts that an arrow with nothing left to scroll stays in the page, stops
	 * taking clicks, and holds the `--inactive` class that hides it.
	 *
	 * @since 1.185.0
	 *
	 * @param {Element|null} arrow The arrow button to check.
	 * @return {void}
	 */
	function expectInactive( arrow: Element | null ) {
		expect( arrow ).toBeInTheDocument();
		expect( arrow ).toBeDisabled();
		expect( arrow ).toHaveClass( INACTIVE_ARROW_CLASS );
	}

	/**
	 * Asserts that an arrow sits outside the tab order and the accessibility
	 * tree.
	 *
	 * @since 1.185.0
	 *
	 * @param {Element|null} arrow The arrow button to check.
	 * @return {void}
	 */
	function expectUnreachable( arrow: Element | null ) {
		expect( arrow ).toHaveAttribute( 'tabindex', '-1' );
		expect( arrow ).toHaveAttribute( 'aria-hidden', 'true' );
	}

	beforeEach( () => {
		global.ResizeObserver = ResizeObserverMock;

		// The component waits for the next animation frame before it updates the
		// arrows, so run every frame right away.
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
		jest.clearAllMocks();

		resizeObserverCallback = undefined;
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

			const { container } = renderTabs();
			const scrollArea = getScrollArea( container );

			setScrollMetrics( scrollArea, {
				scrollLeft: 0,
				clientWidth: 400,
				scrollWidth: 800,
			} );
			fireEvent.scroll( scrollArea );

			expectActive( getArrow( container, RIGHT_ARROW_SELECTOR ) );
			expectInactive( getArrow( container, LEFT_ARROW_SELECTOR ) );
		}
	);

	it( 'shows both arrows when the bar can scroll in both directions', () => {
		const { container } = renderTabs();
		const scrollArea = getScrollArea( container );

		setScrollMetrics( scrollArea, {
			scrollLeft: 200,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		expectActive( getArrow( container, LEFT_ARROW_SELECTOR ) );
		expectActive( getArrow( container, RIGHT_ARROW_SELECTOR ) );
	} );

	it( 'shows only the left arrow when the bar is scrolled to the end', () => {
		const { container } = renderTabs();
		const scrollArea = getScrollArea( container );

		setScrollMetrics( scrollArea, {
			scrollLeft: 400,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		expectActive( getArrow( container, LEFT_ARROW_SELECTOR ) );
		expectInactive( getArrow( container, RIGHT_ARROW_SELECTOR ) );
	} );

	it( 'shows no arrows when all tabs fit', () => {
		const { container } = renderTabs();
		const scrollArea = getScrollArea( container );

		setScrollMetrics( scrollArea, {
			scrollLeft: 0,
			clientWidth: 800,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		expectInactive( getArrow( container, LEFT_ARROW_SELECTOR ) );
		expectInactive( getArrow( container, RIGHT_ARROW_SELECTOR ) );
	} );

	it( 'keeps both active arrows out of the tab order so they can not be navigated to using the keyboard', () => {
		// These arrows are not used for navigation, because the tab bar
		// already moves between tabs on the arrow keys and scrolls each new
		// tab into view.
		const { container, queryAllByRole } = renderTabs();
		const scrollArea = getScrollArea( container );

		setScrollMetrics( scrollArea, {
			scrollLeft: 200,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		expectActive( getArrow( container, LEFT_ARROW_SELECTOR ) );
		expectActive( getArrow( container, RIGHT_ARROW_SELECTOR ) );

		expectUnreachable( getArrow( container, LEFT_ARROW_SELECTOR ) );
		expectUnreachable( getArrow( container, RIGHT_ARROW_SELECTOR ) );

		expect( queryAllByRole( 'button' ) ).toHaveLength( 0 );
	} );

	it( 'shows no arrows when the tabs almost fit, with one pixel hidden at each end', () => {
		const { container } = renderTabs();
		const scrollArea = getScrollArea( container );

		// SCROLL_EDGE_THRESHOLD ignores one hidden pixel at each end, so both
		// arrows read as having nothing left to scroll.
		setScrollMetrics( scrollArea, {
			scrollLeft: 1,
			clientWidth: 400,
			scrollWidth: 402,
		} );
		fireEvent.scroll( scrollArea );

		expectInactive( getArrow( container, LEFT_ARROW_SELECTOR ) );
		expectInactive( getArrow( container, RIGHT_ARROW_SELECTOR ) );
	} );

	it( 'does not scroll the bar when the arrow with nothing left to scroll is clicked', () => {
		const { container } = renderTabs();
		const scrollArea = getScrollArea( container );
		const scrollByMock = jest.fn();
		scrollArea.scrollBy = scrollByMock;

		setScrollMetrics( scrollArea, {
			scrollLeft: 0,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		fireEvent.click(
			getArrow( container, LEFT_ARROW_SELECTOR ) as Element
		);

		expect( scrollByMock ).not.toHaveBeenCalled();
	} );

	it( 'watches the container and the tab set, and shows the right arrow when a resize makes them overflow', () => {
		const { container } = renderTabs();
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

		expectActive( getArrow( container, RIGHT_ARROW_SELECTOR ) );
	} );

	it( 'scrolls the bar forward when the right arrow is clicked', () => {
		const { container } = renderTabs();
		const scrollArea = getScrollArea( container );
		const scrollByMock = jest.fn();
		scrollArea.scrollBy = scrollByMock;

		setScrollMetrics( scrollArea, {
			scrollLeft: 0,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		fireEvent.click(
			getArrow( container, RIGHT_ARROW_SELECTOR ) as Element
		);

		expect( scrollByMock ).toHaveBeenCalledWith( {
			left: 320,
			behavior: 'smooth',
		} );
	} );

	it( 'scrolls the bar backward when the left arrow is clicked', () => {
		const { container } = renderTabs();
		const scrollArea = getScrollArea( container );
		const scrollByMock = jest.fn();
		scrollArea.scrollBy = scrollByMock;

		setScrollMetrics( scrollArea, {
			scrollLeft: 200,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		fireEvent.click(
			getArrow( container, LEFT_ARROW_SELECTOR ) as Element
		);

		expect( scrollByMock ).toHaveBeenCalledWith( {
			left: -320,
			behavior: 'smooth',
		} );
	} );

	it.each( [ BREAKPOINT_SMALL, BREAKPOINT_TABLET ] )(
		'shows no arrows at the %s breakpoint even when the bar overflows',
		( breakpoint ) => {
			( useBreakpoint as jest.Mock ).mockReturnValue( breakpoint );

			const { container } = renderTabs();
			const scrollArea = getScrollArea( container );

			setScrollMetrics( scrollArea, {
				scrollLeft: 200,
				clientWidth: 400,
				scrollWidth: 800,
			} );
			fireEvent.scroll( scrollArea );

			expect(
				getArrow( container, LEFT_ARROW_SELECTOR )
			).not.toBeInTheDocument();
			expect(
				getArrow( container, RIGHT_ARROW_SELECTOR )
			).not.toBeInTheDocument();
			expect( resizeObserverConstructedMock ).not.toHaveBeenCalled();
		}
	);

	it( 'shows the right arrow once the window widens to a desktop width', () => {
		( useBreakpoint as jest.Mock ).mockReturnValue( BREAKPOINT_TABLET );

		const { container, rerender } = renderTabs();
		const scrollArea = getScrollArea( container );

		setScrollMetrics( scrollArea, {
			scrollLeft: 0,
			clientWidth: 400,
			scrollWidth: 800,
		} );
		fireEvent.scroll( scrollArea );

		expect(
			getArrow( container, RIGHT_ARROW_SELECTOR )
		).not.toBeInTheDocument();

		( useBreakpoint as jest.Mock ).mockReturnValue( BREAKPOINT_DESKTOP );
		rerender( <ScrollableTabs>{ mockTabBar }</ScrollableTabs> );

		expectActive( getArrow( container, RIGHT_ARROW_SELECTOR ) );
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

	it( 'shows the right arrow when the container scrolls instead of an inner element', () => {
		const { container } = render(
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

		expectActive( getArrow( container, RIGHT_ARROW_SELECTOR ) );
	} );

	it( 'shows the right arrow when a custom selector says which element scrolls', () => {
		const { container } = render(
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

		expectActive( getArrow( container, RIGHT_ARROW_SELECTOR ) );
	} );
} );

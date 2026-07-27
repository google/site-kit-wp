/**
 * ScrollableTabs component.
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
import classnames from 'classnames';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import ChevronLeftIcon from '@/svg/icons/chevron-left-outlined.svg';
import ChevronRightIcon from '@/svg/icons/chevron-right-outlined.svg';

/**
 * Tolerance in pixels when reading scroll metrics, to ignore subpixel
 * rounding at either end of the bar.
 */
const SCROLL_EDGE_THRESHOLD = 1;

/**
 * Fraction of the visible width to scroll per arrow activation, keeping a
 * little of the previous view for context.
 */
const SCROLL_PAGE_FACTOR = 0.8;

export interface ScrollableTabsProps {
	/** The extra class names merged onto the container element. */
	className?: string;
	/** The selector for the element that scrolls within the container. Defaults to the MDC tab scroller's scroll area. */
	scrollTargetSelector?: string;
}

const ScrollableTabs: FC< ScrollableTabsProps > = ( {
	children,
	className,
	scrollTargetSelector = '.mdc-tab-scroller__scroll-area',
} ) => {
	const breakpoint = useBreakpoint();
	const isDesktop =
		breakpoint !== BREAKPOINT_SMALL && breakpoint !== BREAKPOINT_TABLET;

	const containerRef = useRef< HTMLDivElement >( null );
	const scrollNodeRef = useRef< Element | null >( null );
	const [ canScrollLeft, setCanScrollLeft ] = useState( false );
	const [ canScrollRight, setCanScrollRight ] = useState( false );

	const updateScrollState = useCallback( () => {
		const scrollNode = scrollNodeRef.current;

		if ( ! scrollNode ) {
			return;
		}

		const { scrollLeft, clientWidth, scrollWidth } = scrollNode;

		setCanScrollLeft( scrollLeft > SCROLL_EDGE_THRESHOLD );
		setCanScrollRight(
			scrollLeft + clientWidth < scrollWidth - SCROLL_EDGE_THRESHOLD
		);
	}, [] );

	useEffect( () => {
		const container = containerRef.current;

		if ( ! isDesktop || ! container ) {
			return () => {};
		}

		// MDC's tab bar scrolls an inner element rather than its wrapper, so
		// resolve the scrolling element within the container. When nothing
		// matches the selector, the container itself scrolls. The lookup runs
		// only when this effect does, so a tab bar that reaches the DOM later
		// leaves the arrows reading the container instead.
		const scrollNode =
			container.querySelector( scrollTargetSelector ) || container;

		scrollNodeRef.current = scrollNode;
		updateScrollState();

		let animationFrameID: number | null = null;
		function onScroll() {
			if ( animationFrameID !== null ) {
				return;
			}

			animationFrameID = window.requestAnimationFrame( () => {
				animationFrameID = null;
				updateScrollState();
			} );
		}

		scrollNode.addEventListener( 'scroll', onScroll, { passive: true } );

		// The scroll node's own size follows the container, while its first
		// element child holds the full tab set. Observing both covers window
		// resizes and changes to the tab set.
		const observer = new ResizeObserver( updateScrollState );
		observer.observe( scrollNode );
		if ( scrollNode.firstElementChild ) {
			observer.observe( scrollNode.firstElementChild );
		}

		return () => {
			scrollNode.removeEventListener( 'scroll', onScroll );
			observer.disconnect();

			if ( animationFrameID !== null ) {
				window.cancelAnimationFrame( animationFrameID );
			}

			scrollNodeRef.current = null;
		};
	}, [ isDesktop, scrollTargetSelector, updateScrollState ] );

	function scrollByPage( direction: number ) {
		const scrollNode = scrollNodeRef.current;

		if ( ! scrollNode ) {
			return;
		}

		scrollNode.scrollBy( {
			left: direction * scrollNode.clientWidth * SCROLL_PAGE_FACTOR,
			behavior: 'smooth',
		} );
	}

	return (
		<div
			ref={ containerRef }
			className={ classnames(
				'googlesitekit-scrollable-tabs',
				className
			) }
		>
			{ isDesktop && canScrollLeft && (
				<button
					type="button"
					className="googlesitekit-scrollable-tabs__arrow googlesitekit-scrollable-tabs__arrow--left"
					aria-label={ __( 'Scroll tabs left', 'google-site-kit' ) }
					onClick={ () => scrollByPage( -1 ) }
				>
					<ChevronLeftIcon width={ 20 } height={ 20 } />
				</button>
			) }
			{ children }
			{ isDesktop && canScrollRight && (
				<button
					type="button"
					className="googlesitekit-scrollable-tabs__arrow googlesitekit-scrollable-tabs__arrow--right"
					aria-label={ __( 'Scroll tabs right', 'google-site-kit' ) }
					onClick={ () => scrollByPage( 1 ) }
				>
					<ChevronRightIcon width={ 20 } height={ 20 } />
				</button>
			) }
		</div>
	);
};

export default ScrollableTabs;

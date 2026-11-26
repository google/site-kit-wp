/**
 * `useScrollToAdjustingForHeight` hook.
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
import { useEvent, useTimeoutFn, useUnmount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBreakpoint } from '@/js/hooks/useBreakpoint';
import { getNavigationalScrollTop } from '@/js/util/scroll';

/**
 * The page scrolls to the element again only once it moves more than this
 * many pixels, so a subpixel shift never starts a scroll.
 */
const MOVE_THRESHOLD_PIXELS = 1;

/**
 * The longest time the page keeps the element in place after a call.
 */
const ADJUSTING_TIMEOUT_MILLISECONDS = 30 * 1000;

/**
 * Returns a function that scrolls smoothly to an element, and keeps it just
 * below the sticky header while the page above it changes height.
 *
 * The page keeps the element in place until the user's first mouse wheel
 * scroll, click, tap or key press, and for 30 seconds at most.
 *
 * @since 1.193.0
 *
 * @return {Function} The function that scrolls to the element its selector names.
 */
export default function useScrollToAdjustingForHeight(): (
	selector: string
) => void {
	const breakpoint = useBreakpoint();
	const observerRef = useRef< ResizeObserver | null >( null );

	const stop = useCallback( () => {
		observerRef.current?.disconnect();
		observerRef.current = null;
	}, [] );

	const [ , , restartTimeout ] = useTimeoutFn(
		stop,
		ADJUSTING_TIMEOUT_MILLISECONDS
	);

	// The user's own input stops the scroll, so the page never scrolls against
	// the user. A smooth scroll the hook started runs on until a new scroll,
	// so an instant scroll ends it. That instant scroll ends a mouse wheel
	// turn's own scroll too, so it moves the page by the turn's distance. A
	// turn with `Ctrl` pressed zooms the page rather than scrolling it.
	const stopForUserInput = useCallback(
		( event: Event ) => {
			if ( observerRef.current ) {
				const wheelDistance =
					event instanceof WheelEvent && ! event.ctrlKey
						? event.deltaY
						: 0;

				global.scrollTo( {
					top: global.scrollY + wheelDistance,
					behavior: 'instant',
				} );
			}

			stop();
		},
		[ stop ]
	);

	// The `wheel` listener is passive, so the browser never waits for it before
	// it scrolls.
	useEvent( 'wheel', stopForUserInput, window, { passive: true } );
	useEvent( 'pointerdown', stopForUserInput );
	useEvent( 'keydown', stopForUserInput );
	useUnmount( stop );

	return useCallback(
		( selector: string ) => {
			stop();

			// `getNavigationalScrollTop()` gives 0 for a selector that matches no
			// element, which would scroll the page to its top.
			if ( ! document.querySelector( selector ) ) {
				return;
			}

			let top = getNavigationalScrollTop( selector, breakpoint );

			global.scrollTo( { top, behavior: 'smooth' } );

			const page = document.querySelector( '.googlesitekit-page' );

			if ( ! page ) {
				return;
			}

			const observer = new ResizeObserver( () => {
				if ( ! document.querySelector( selector ) ) {
					stop();
					return;
				}

				const newTop = getNavigationalScrollTop( selector, breakpoint );

				if ( Math.abs( newTop - top ) <= MOVE_THRESHOLD_PIXELS ) {
					return;
				}

				top = newTop;
				global.scrollTo( { top, behavior: 'smooth' } );
			} );

			observer.observe( page );
			observerRef.current = observer;
			restartTimeout();
		},
		[ breakpoint, restartTimeout, stop ]
	);
}

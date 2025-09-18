/**
 * The useOverflowingTabs hook.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useMount, useUnmount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDebounce } from '@/js/hooks/useDebounce';

/**
 * Ensures that on small screens the last tab is visually cut off to imply
 * scroll, and wires up resize handling and open transitions.
 *
 * @since n.e.x.t
 *
 * @param {Object}  args                              Arguments.
 * @param {Object}  args.containerRef                 Ref to the container element.
 * @param {boolean} args.isMobileBreakpoint           Whether current breakpoint is small.
 * @param {boolean} args.isSelectionPanelOpen         Current open state for selection panel.
 * @param {boolean} args.isSelectionPanelOpenPrevious Previous open state for selection panel.
 */
export default function useOverflowingTabs( {
	containerRef,
	isMobileBreakpoint,
	isSelectionPanelOpen,
	isSelectionPanelOpenPrevious,
} ) {
	// It is not always clear that tabs are scrollable on mobile, so we need to ensure that the last tab item
	// is cutoff to indicate that there are more tabs to scroll to.
	const maybeCutOffLastTabItem = useCallback( () => {
		const scrollContainer = containerRef.current?.querySelector(
			'.mdc-tab-scroller__scroll-content'
		);

		if ( ! isMobileBreakpoint ) {
			return;
		}

		const tabItems = containerRef.current?.querySelectorAll(
			'.googlesitekit-chip-tab-group__tab-items .mdc-tab'
		);

		if ( ! tabItems?.length || ! scrollContainer ) {
			return;
		}

		const containerRect = containerRef.current?.getBoundingClientRect();

		const visibleItems = [];
		tabItems.forEach( ( tabItem, index ) => {
			const tabItemRect = tabItem.getBoundingClientRect();
			if (
				tabItemRect.left >= containerRect.left &&
				tabItemRect.right <= containerRect.right
			) {
				visibleItems.push( index );
			}
		} );
		const nextTabItem = tabItems[ visibleItems.length ];

		if ( ! nextTabItem ) {
			return;
		}

		const nextTabItemRect = nextTabItem.getBoundingClientRect();

		// If the next tab item is either completely off-screen or only barely
		// visible (i.e. cut off by 15px or less, meaning most likely it is still
		// outside the visible area), reduce the column gap so that the last tab
		// item appears properly truncated.
		if (
			nextTabItemRect.left >= containerRect.right ||
			( nextTabItemRect.left - containerRect.right < 0 &&
				-( nextTabItemRect.left - containerRect.right ) <= 20 )
		) {
			// If there is an inline gap of 2px we already adjusted it once, and
			// the last item is still not cut off, we need to adjust the column
			// gap to 20px to ensure the last item is cut off.
			if ( scrollContainer.style.columnGap === '2px' ) {
				scrollContainer.style.columnGap = '20px';
			} else {
				scrollContainer.style.columnGap = '2px';
			}

			maybeCutOffLastTabItem();
		}
	}, [ containerRef, isMobileBreakpoint ] );

	// Debounce the maybeCutOffLastTabItem function
	const debouncedMaybeCutOffLastTabItem = useDebounce(
		maybeCutOffLastTabItem,
		50
	);

	useMount( () => {
		global.addEventListener( 'resize', debouncedMaybeCutOffLastTabItem );
	} );

	useUnmount( () =>
		global.removeEventListener( 'resize', debouncedMaybeCutOffLastTabItem )
	);

	useEffect( () => {
		if ( ! isSelectionPanelOpenPrevious && isSelectionPanelOpen ) {
			maybeCutOffLastTabItem();
		}
	}, [
		isSelectionPanelOpen,
		isSelectionPanelOpenPrevious,
		maybeCutOffLastTabItem,
	] );
}

/**
 * DataBlockGroup component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useRef, useCallback } from '@wordpress/element';
import { useDebounce } from '../hooks/useDebounce';

export default function DataBlockGroup( { className, children } ) {
	const ref = useRef();
	const lastViewportWidthRef = useRef( 0 );

	const adjustFontSize = useCallback( () => {
		const blocks = ref?.current?.querySelectorAll(
			'.googlesitekit-data-block'
		);

		if ( ! blocks?.length ) {
			return;
		}

		// Reset font sizes first to get accurate measurement, specifically on resize.
		setFontSizes( blocks, '' );

		// Find the smallest font size needed across all blocks to fit without overflow.
		let smallestScaleFactor = 1;

		blocks.forEach( ( block ) => {
			const dataPoint = block.querySelector(
				'.googlesitekit-data-block__datapoint'
			);

			if ( ! dataPoint ) {
				return;
			}

			const parentWidth = dataPoint?.parentElement?.offsetWidth;

			if ( dataPoint.scrollWidth > parentWidth ) {
				// Calculate the exact scale factor needed to resize the content to the parent.
				const scaleFactor = parentWidth / dataPoint.scrollWidth;

				if ( scaleFactor < smallestScaleFactor ) {
					smallestScaleFactor = scaleFactor;
				}
			}
		} );

		// Apply the smallest font size to all blocks if adjustment is needed.
		if ( smallestScaleFactor < 1 ) {
			const fontSize = parseInt(
				global?.getComputedStyle(
					blocks[ 0 ].querySelector(
						'.googlesitekit-data-block__datapoint'
					)
				)?.fontSize,
				10
			);

			const newSize = Math.floor( fontSize * smallestScaleFactor );
			const clampedNewSize = Math.max( newSize, 14 ); // Don't allow the font size to go below 14px.
			setFontSizes( blocks, `${ clampedNewSize }px` );
		}
	}, [] );

	const setFontSizes = ( blocks, adjustedSize ) => {
		blocks.forEach( ( block ) => {
			const dataPoint = block?.querySelector(
				'.googlesitekit-data-block__datapoint'
			);
			if ( ! dataPoint ) {
				return;
			}

			dataPoint.style.fontSize = adjustedSize;
		} );
	};

	const handleResize = useDebounce( () => {
		// Only adjust font size if the width has changed.
		if ( global.innerWidth !== lastViewportWidthRef.current ) {
			lastViewportWidthRef.current = global.innerWidth;
			adjustFontSize();
		}
	}, 100 );

	useMount( () => {
		lastViewportWidthRef.current = global.innerWidth;

		// Initial font size adjustment
		adjustFontSize();

		global.addEventListener( 'resize', handleResize );
	} );

	useUnmount( () => {
		global.removeEventListener( 'resize', handleResize );
	} );

	return (
		<div ref={ ref } className={ className }>
			{ children }
		</div>
	);
}

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
import { useRef } from '@wordpress/element';
import { useDebounce } from '../hooks/useDebounce';
import { useEffect } from 'react';

export default function DataBlockGroup( { className, children } ) {
	const ref = useRef();
	// const [ fontSizeOnLoad, setFontSizeOnLoad ] = useRef( null );

	// useEffect( () => {
	// 	// Set the initial font size on load.
	// 	const blocks = ref?.current?.querySelectorAll(
	// 		'.googlesitekit-data-block'
	// 	);
	// 	if ( blocks?.length ) {
	// 		const firstBlockDataPoint = blocks[ 0 ]?.querySelector(
	// 			'.googlesitekit-data-block__datapoint'
	// 		);
	// 		if ( firstBlockDataPoint ) {
	// 			setFontSizeOnLoad( firstBlockDataPoint.style.fontSize );
	// 		}
	// 	}
	// }, [] );

	// Get body width:
	const bodyWidth = global?.document?.body?.offsetWidth || 0;

	const adjustFontSize = () => {
		const blocks = ref?.current?.querySelectorAll(
			'.googlesitekit-data-block'
		);

		if ( ! blocks?.length ) {
			return;
		}
		console.log(
			`🚀 ${ bodyWidth } ~ adjustFontSize ~ blocks?.length:`,
			blocks?.length
		);

		// Reset font sizes first to get accurate measurement, specifically on resize.
		// setFontSizes( blocks, '' );

		// Find the smallest font size needed across all blocks to fit without overflow.
		let smallestScaleFactor = 1;

		blocks.forEach( ( block ) => {
			const dataPoint = block.querySelector(
				'.googlesitekit-data-block__datapoint'
			);
			console.log(
				`🚀 ${ bodyWidth } ~ blocks.forEach ~ dataPoint:`,
				dataPoint
			);

			if ( ! dataPoint ) {
				return;
			}

			// Console log innerText for debugging purposes.
			console.log(
				`🚀 ${ bodyWidth } ~ blocks.forEach ~ dataPoint.innerText:`,
				dataPoint.innerText
			);

			const parentWidth = dataPoint?.parentElement?.offsetWidth;

			if ( dataPoint.scrollWidth > parentWidth ) {
				// Calculate the exact scale factor needed to resize the content to the parent.
				const scaleFactor = parentWidth / dataPoint.scrollWidth;

				// Round scaling factor **down* to the nearest .05 to account for variations in font rendering.
				const roundedScaleFactor = Math.floor( scaleFactor * 20 ) / 20;
				console.log(
					`🚀 ${ bodyWidth } ~ blocks.forEach ~ roundedScaleFactor:`,
					roundedScaleFactor
				);

				//console log the parent for debugging purposes.
				console.log(
					`🚀 ${ bodyWidth } ~ blocks.forEach ~ parent:`,
					dataPoint.parentElement
				);

				console.log(
					`🚀 ${ bodyWidth } ~ blocks.forEach ~ scaleFactor:`,
					scaleFactor
				);
				console.log(
					`🚀 ${ bodyWidth } ~ blocks.forEach ~ dataPoint.scrollWidth:`,
					dataPoint.scrollWidth
				);
				console.log(
					`🚀 ${ bodyWidth } ~ blocks.forEach ~ parentWidth:`,
					parentWidth
				);

				if ( roundedScaleFactor < smallestScaleFactor ) {
					smallestScaleFactor = roundedScaleFactor;
				}
			}
		} );

		// Apply the smallest font size to all blocks if adjustment is needed.
		console.log(
			'🚀 ~ adjustFontSize ~ smallestScaleFactor < 1 :',
			smallestScaleFactor < 1
		);
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
			console.log(
				`🚀 ${ bodyWidth } ~ adjustFontSize ~ newSize:`,
				newSize
			);
			const clampedNewSize = Math.max( newSize, 14 ); // Don't allow the font size to go below 14px.
			setFontSizes( blocks, `${ clampedNewSize }px` );
		}
	};

	const setFontSizes = ( blocks, adjustedSize ) => {
		console.log(
			`🚀 ${ bodyWidth } ~ setFontSizes ~ adjustedSize:`,
			adjustedSize
		);
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

	// Debounce the adjustFontSize function to prevent excessive calls on resize.
	const debouncedAdjustFontSize = useDebounce( adjustFontSize, 50 );

	useMount( () => {
		adjustFontSize();

		global.addEventListener( 'resize', debouncedAdjustFontSize );
		global.addEventListener( 'resize', () => {
			console.log(
				`🚀 ${ bodyWidth } ~ DataBlockGroup ~ resize event triggered`
			);
		} );
	} );

	useUnmount( () =>
		global.removeEventListener( 'resize', debouncedAdjustFontSize )
	);

	return (
		<div ref={ ref } className={ className }>
			{ children }
		</div>
	);
}

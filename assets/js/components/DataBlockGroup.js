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
import { useLifecycles } from 'react-use';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

export default function DataBlockGroup( { className, children } ) {
	const ref = useRef();

	const adjustFontSize = () => {
		const blocks = ref?.current?.querySelectorAll(
			'.googlesitekit-data-block'
		);

		if ( ! blocks ) {
			return;
		}

		const firstDataPoint = blocks[ 0 ]?.querySelector(
			'.googlesitekit-data-block__datapoint'
		);

		if ( ! firstDataPoint ) {
			return;
		}

		// Reset font sizes, so on screen rotation/resize the font size
		// can be re-calculated.
		setFontSizes( blocks, '' );

		// Set the default value to the current font size of the blocks.
		const originalSize = parseInt(
			global?.getComputedStyle( firstDataPoint )?.fontSize,
			10
		);
		let adjustedSize = originalSize;

		// Loop through the blocks to determine the smallest size needed to fit
		// if any of the blocks are outside their container.
		blocks.forEach( ( block ) => {
			const dataPoint = block.querySelector(
				'.googlesitekit-data-block__datapoint'
			);

			if ( ! dataPoint ) {
				return;
			}

			let fontSize = parseInt(
				global?.getComputedStyle( dataPoint )?.fontSize,
				10
			);
			const parentWidth = dataPoint?.parentElement?.offsetWidth;

			// If the block value overflows the parent container, we want to keep
			// decrementing the font size by 1 until it fits the container,
			// so we can find the optimal font size. And it should't go below minimal value
			// which is 14px.
			if ( dataPoint.scrollWidth > parentWidth && fontSize > 14 ) {
				while ( dataPoint.scrollWidth > parentWidth && fontSize > 14 ) {
					fontSize -= 1;
					dataPoint.style.fontSize = `${ fontSize }px`;
				}
				adjustedSize = fontSize;
			}
		} );

		// If the initial loop found a block or blocks that needed adjustments to fit
		// the container, only in that case, apply the final font size to all the blocks as well.
		if ( originalSize !== adjustedSize ) {
			// Loop through the blocks to set the adjusted font size to
			// all the blocks in the current group.
			setFontSizes( blocks, `${ adjustedSize }px` );
		}
	};

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

	useLifecycles(
		() => {
			adjustFontSize();

			global.addEventListener( 'resize', adjustFontSize );
		},
		() => {
			global.removeEventListener( 'resize', adjustFontSize );
		}
	);

	return (
		<div ref={ ref } className={ className }>
			{ children }
		</div>
	);
}

/**
 * UI related utility functions.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * Returns properties to be used for the Cell component.
 *
 * @since n.e.x.t
 *
 * @param {Object}  layoutSizeCellProps Initial props for the cell.
 * @param {string}  format              Format can be small or larger.
 * @param {boolean} hasErrorOrWarning   Are we showing a warning.
 * @param {boolean} hasSmallImageSVG    Does the adjacent cells have a small SVG image.
 * @param {boolean} hasWinImageSVG      Does the adjacent cells have an SVG image.
 * @return {string} The URL path.
 */
export const determineCellProperties = (
	layoutSizeCellProps,
	format,
	hasErrorOrWarning,
	hasSmallImageSVG,
	hasWinImageSVG
) => {
	let layoutOrderCellProps = {
		smOrder: 2,
		mdOrder: 1,
	};
	let winImageCellProps = {
		smSize: 4,
		mdSize: 2,
		lgSize: 4,
		smOrder: 1,
		mdOrder: 2,
	};

	switch ( format ) {
		case 'small':
			layoutOrderCellProps = {};
			break;
		case 'larger':
			layoutOrderCellProps = {
				...layoutOrderCellProps,
				mdOrder: 2,
				lgOrder: 1,
			};

			winImageCellProps = {
				...winImageCellProps,
				smSize: 4,
				mdSize: 8,
				lgSize: 7,
				mdOrder: 1,
				lgOrder: 2,
			};
			break;
	}

	Object.keys( layoutSizeCellProps ).forEach( ( key ) => {
		let size = layoutSizeCellProps[ key ];
		if ( hasErrorOrWarning ) {
			size = size - 1;
		}

		if ( hasSmallImageSVG ) {
			size = size - 1;
		}

		if (
			hasWinImageSVG &&
			( ( key === 'smSize' && winImageCellProps?.[ key ] < 4 ) ||
				( key === 'mdSize' && winImageCellProps?.[ key ] < 8 ) ||
				( key === 'lgSize' && winImageCellProps?.[ key ] < 12 ) )
		) {
			size = size - winImageCellProps[ key ];
		}

		layoutSizeCellProps[ key ] = size;
	} );

	return {
		layoutSizeCellProps,
		layoutOrderCellProps,
		winImageCellProps,
	};
};

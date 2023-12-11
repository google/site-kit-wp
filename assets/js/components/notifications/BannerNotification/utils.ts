/**
 * BannerNotification utility functions.
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

export const ERROR_OR_WARNING_SIZE = 1;
export const SMALL_IMAGE_SVG_SIZE = 1;

/**
 * Returns the cell size for the content area within BannerNotification.
 *
 * @since 1.69.0
 *
 * @param {Object}  args                   Arguments.
 * @param {boolean} args.hasErrorOrWarning Whether the banner is rendering an error or a warning.
 * @param {boolean} args.hasSmallImageSVG  Whether the banner is rendering a small image.
 * @param {boolean} args.hasWinImageSVG    Whether the banner is rendering a large image.
 * @param {string}  [args.format]          The notification format. Can be either small, large or larger. Default: small.
 * @return {Object} The cell size for each breakpoint denoted by the smSize, mdSize and lgSize keys.
 */
export function getContentCellSizeProperties( {
	format = 'small',
	hasErrorOrWarning,
	hasSmallImageSVG,
	hasWinImageSVG,
}: {
	format?: 'small' | 'large' | 'larger';
	hasErrorOrWarning: boolean;
	hasSmallImageSVG: boolean;
	hasWinImageSVG: boolean;
} ): {
	smSize: number;
	mdSize: number;
	lgSize: number;
} {
	const sizes = {
		smSize: 4,
		mdSize: 8,
		lgSize: 12,
	};
	const imageCellSizes = getImageCellSizeProperties( format );

	Object.keys( sizes ).forEach( ( key ) => {
		let size = sizes[ key ];
		if ( hasErrorOrWarning ) {
			size = size - ERROR_OR_WARNING_SIZE;
		}

		if ( hasSmallImageSVG ) {
			size = size - SMALL_IMAGE_SVG_SIZE;
		}

		if ( hasWinImageSVG && 0 < size - imageCellSizes[ key ] ) {
			size = size - imageCellSizes[ key ];
		}

		sizes[ key ] = size;
	} );

	return sizes;
}

/**
 * Gets the cell order for the content area within BannerNotification.
 *
 * @since 1.69.0
 *
 * @param {string} format The format of the notification. Can be either small or larger.
 * @return {Object} The cell order for each breakpoint denoted by the smOrder, mdOrder and lgOrder keys.
 */
export const getContentCellOrderProperties = (
	format: 'small' | 'larger'
): {
	smOrder?: number;
	mdOrder?: number;
	lgOrder?: number;
} => {
	switch ( format ) {
		case 'small':
			return {};
		case 'larger':
			return {
				smOrder: 2,
				mdOrder: 2,
				lgOrder: 1,
			};
		default:
			return {
				smOrder: 2,
				mdOrder: 1,
			};
	}
};

/**
 * Gets the cell size for the image area within BannerNotification.
 *
 * @since 1.69.0
 *
 * @param {string} format The format of the notification. Can be either smaller or larger.
 * @return {Object} The cell size for each breakpoint denoted by the smSize, mdSize and lgSize keys.
 */
export function getImageCellSizeProperties( format: 'smaller' | 'larger' ): {
	smSize: number;
	mdSize: number;
	lgSize: number;
} {
	switch ( format ) {
		case 'smaller':
			return {
				smSize: 4,
				mdSize: 2,
				lgSize: 2,
			};
		case 'larger':
			return {
				smSize: 4,
				mdSize: 8,
				lgSize: 7,
			};
		default:
			return {
				smSize: 4,
				mdSize: 2,
				lgSize: 4,
			};
	}
}

/**
 * Gets the cell order for the image area within BannerNotification.
 *
 * @since 1.69.0
 *
 * @param {string} format The format of the notification. Can be larger.
 * @return {Object} The cell size for each breakpoint denoted by the smOrder, mdOrder and lgOrder keys.
 */
export function getImageCellOrderProperties( format: 'larger' ): {
	smOrder: number;
	mdOrder: number;
	lgOrder?: number;
} {
	switch ( format ) {
		case 'larger':
			return {
				smOrder: 1,
				mdOrder: 1,
				lgOrder: 2,
			};
		default:
			return {
				smOrder: 1,
				mdOrder: 2,
			};
	}
}

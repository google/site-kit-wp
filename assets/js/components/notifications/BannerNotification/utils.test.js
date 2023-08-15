/**
 * BannerNotification utility functions tests.
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
 * Internal dependencies
 */
import {
	getContentCellOrderProperties,
	getContentCellSizeProperties,
	getImageCellSizeProperties,
	getImageCellOrderProperties,
} from './utils';

describe( 'getContentCellSizeProperties', () => {
	const defaultSizes = {
		smSize: 4,
		mdSize: 8,
		lgSize: 12,
	};

	it( 'should return the default sizes when no parameters are provided', () => {
		const sizes = getContentCellSizeProperties( {} );
		expect( sizes ).toEqual( defaultSizes );
	} );

	it( 'should decrease all sizes by 1 if `hasErrorOrWarning` is `true`', () => {
		const sizes = getContentCellSizeProperties( {
			hasErrorOrWarning: true,
		} );
		expect( sizes ).toEqual( {
			smSize: defaultSizes.smSize - 1,
			mdSize: defaultSizes.mdSize - 1,
			lgSize: defaultSizes.lgSize - 1,
		} );
	} );

	it( 'should decrease all sizes by 1 if `hasSmallImageSVG` is `true`', () => {
		const sizes = getContentCellSizeProperties( {
			hasSmallImageSVG: true,
		} );
		expect( sizes ).toEqual( {
			smSize: defaultSizes.smSize - 1,
			mdSize: defaultSizes.mdSize - 1,
			lgSize: defaultSizes.lgSize - 1,
		} );
	} );

	it( 'should decrease all sizes by 2 if `hasSmallImageSVG` and `hasErrorOrWarning` are `true`', () => {
		const sizes = getContentCellSizeProperties( {
			hasSmallImageSVG: true,
			hasErrorOrWarning: true,
		} );
		expect( sizes ).toEqual( {
			smSize: defaultSizes.smSize - 2,
			mdSize: defaultSizes.mdSize - 2,
			lgSize: defaultSizes.lgSize - 2,
		} );
	} );

	it( 'should decrease all sizes by the appropriate image sizes if `hasWinImageSVG` is `true`', () => {
		const sizes = getContentCellSizeProperties( {
			hasWinImageSVG: true,
		} );
		const imageCellSizes = getImageCellSizeProperties();
		expect( sizes ).toEqual( {
			smSize:
				defaultSizes.smSize - imageCellSizes.smSize ||
				defaultSizes.smSize,
			mdSize:
				defaultSizes.mdSize - imageCellSizes.mdSize ||
				defaultSizes.smSize,
			lgSize:
				defaultSizes.lgSize - imageCellSizes.lgSize ||
				defaultSizes.smSize,
		} );
	} );
} );

describe( 'getContentCellOrderProperties', () => {
	const defaultOrder = {
		smOrder: 2,
		mdOrder: 1,
	};

	it( 'should return the default order when no format is provided', () => {
		const order = getContentCellOrderProperties();
		expect( order ).toEqual( defaultOrder );
	} );

	it( 'should return the default order when an invalid format is provided', () => {
		const order = getContentCellOrderProperties( 'foo' );
		expect( order ).toEqual( defaultOrder );
	} );

	it( 'should return an empty object when the `small` format is provided', () => {
		const order = getContentCellOrderProperties( 'small' );

		expect( order ).toEqual( {} );
	} );

	it( 'should return the correct order when the `larger` format is provided', () => {
		const order = getContentCellOrderProperties( 'larger' );
		expect( order ).toEqual( {
			smOrder: 2,
			mdOrder: 2,
			lgOrder: 1,
		} );
	} );
} );

describe( 'getImageCellOrderProperties', () => {
	const defaultOrder = {
		smOrder: 1,
		mdOrder: 2,
	};

	it( 'should return the default order when no format is provided', () => {
		const order = getImageCellOrderProperties();
		expect( order ).toEqual( defaultOrder );
	} );

	it( 'should return the default order when an invalid format is provided', () => {
		const order = getImageCellOrderProperties( 'foo' );
		expect( order ).toEqual( defaultOrder );
	} );

	it( 'should return the correct order when the `larger` format is provided', () => {
		const order = getImageCellOrderProperties( 'larger' );
		expect( order ).toEqual( {
			smOrder: 1,
			mdOrder: 1,
			lgOrder: 2,
		} );
	} );
} );

describe( 'getImageCellSizeProperties', () => {
	const defaultSizes = {
		smSize: 4,
		mdSize: 2,
		lgSize: 4,
	};

	it( 'should return the default sizes when no format is provided', () => {
		const order = getImageCellSizeProperties();
		expect( order ).toEqual( defaultSizes );
	} );

	it( 'should return the default sizes when an invalid format is provided', () => {
		const order = getImageCellSizeProperties( 'foo' );
		expect( order ).toEqual( defaultSizes );
	} );

	it( 'should return the correct sizes when the `larger` format is provided', () => {
		const order = getImageCellSizeProperties( 'larger' );
		expect( order ).toEqual( {
			smSize: 4,
			mdSize: 8,
			lgSize: 7,
		} );
	} );

	it( 'should return the correct sizes when the `smaller` format is provided', () => {
		const order = getImageCellSizeProperties( 'smaller' );
		expect( order ).toEqual( {
			smSize: 4,
			mdSize: 2,
			lgSize: 2,
		} );
	} );
} );

/**
 * Cell utility tests.
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
} from './cell';

describe( 'getContentCellSizeProperties', () => {
	it( 'should return the default sizes when no parameters are provided', () => {
		const sizes = getContentCellSizeProperties( {} );
		expect( sizes ).toEqual( {
			smSize: 4,
			mdSize: 8,
			lgSize: 12,
		} );
	} );

	it( 'should return updated mdSize when inlineLayout is provided', () => {
		const sizes = getContentCellSizeProperties( {
			format: 'small',
			inlineLayout: true,
		} );
		expect( sizes ).toEqual( {
			smSize: 4,
			mdSize: 7,
			lgSize: 12,
		} );
	} );

	it( 'should return decrease all sizes by 1 if hasErrorOrWarning is provided', () => {
		const sizes = getContentCellSizeProperties( {
			format: 'small',
			inlineLayout: false,
			hasErrorOrWarning: true,
		} );
		expect( sizes ).toEqual( {
			smSize: 3,
			mdSize: 7,
			lgSize: 11,
		} );
	} );

	it( 'should return decrease all sizes by 1 if hasSmallImageSVG is provided', () => {
		const sizes = getContentCellSizeProperties( {
			format: 'small',
			inlineLayout: false,
			hasErrorOrWarning: false,
			hasSmallImageSVG: true,
		} );
		expect( sizes ).toEqual( {
			smSize: 3,
			mdSize: 7,
			lgSize: 11,
		} );
	} );

	it( 'should return decrease all sizes by 2 if hasSmallImageSVG and hasErrorOrWarning are provided', () => {
		const sizes = getContentCellSizeProperties( {
			format: 'small',
			inlineLayout: false,
			hasErrorOrWarning: true,
			hasSmallImageSVG: true,
		} );
		expect( sizes ).toEqual( {
			smSize: 2,
			mdSize: 6,
			lgSize: 10,
		} );
	} );

	it( 'should return decrease all sizes by the appropriate image sizes if imageCellSizes are provided', () => {
		const sizes = getContentCellSizeProperties( {
			format: 'small',
			inlineLayout: false,
			hasErrorOrWarning: false,
			hasSmallImageSVG: false,
			hasWinImageSVG: true,
		} );
		expect( sizes ).toEqual( {
			smSize: 4,
			mdSize: 6,
			lgSize: 8,
		} );
	} );

	it( 'should return decrease all sizes by the appropriate image sizes if all parameters are provided', () => {
		const sizes = getContentCellSizeProperties( {
			format: 'small',
			inlineLayout: true,
			hasErrorOrWarning: true,
			hasSmallImageSVG: true,
			hasWinImageSVG: true,
		} );
		expect( sizes ).toEqual( {
			smSize: 2,
			mdSize: 3,
			lgSize: 6,
		} );
	} );
} );

describe( 'getContentCellOrderProperties', () => {
	it( 'should return the default order when no format is provided', () => {
		const order = getContentCellOrderProperties();
		expect( order ).toEqual( {
			smOrder: 2,
			mdOrder: 1,
		} );
	} );

	it( 'should return the default order when an invalid format is provided', () => {
		const order = getContentCellOrderProperties( 'foo' );
		expect( order ).toEqual( {
			smOrder: 2,
			mdOrder: 1,
		} );
	} );

	it( 'should return an empty object when larger small is provided', () => {
		const order = getContentCellOrderProperties( 'small' );
		expect( order ).toEqual( {} );
	} );

	it( 'should return the correct order when larger format is provided', () => {
		const order = getContentCellOrderProperties( 'larger' );
		expect( order ).toEqual( {
			smOrder: 2,
			mdOrder: 2,
			lgOrder: 1,
		} );
	} );
} );

describe( 'getImageCellOrderProperties', () => {
	it( 'should return the default order when no format is provided', () => {
		const order = getImageCellOrderProperties();
		expect( order ).toEqual( {
			smOrder: 1,
			mdOrder: 2,
		} );
	} );

	it( 'should return the default order when an invalid format is provided', () => {
		const order = getImageCellOrderProperties( 'foo' );
		expect( order ).toEqual( {
			smOrder: 1,
			mdOrder: 2,
		} );
	} );

	it( 'should return the correct order when larger format is provided', () => {
		const order = getImageCellOrderProperties( 'larger' );
		expect( order ).toEqual( {
			smOrder: 1,
			mdOrder: 1,
			lgOrder: 2,
		} );
	} );
} );

describe( 'getImageCellSizeProperties', () => {
	it( 'should return the default size when no format is provided', () => {
		const order = getImageCellSizeProperties();
		expect( order ).toEqual( {
			smSize: 4,
			mdSize: 2,
			lgSize: 4,
		} );
	} );

	it( 'should return the default size when an invalid format is provided', () => {
		const order = getImageCellSizeProperties( 'foo' );
		expect( order ).toEqual( {
			smSize: 4,
			mdSize: 2,
			lgSize: 4,
		} );
	} );

	it( 'should return the correct size when larger format is provided', () => {
		const order = getImageCellSizeProperties( 'larger' );
		expect( order ).toEqual( {
			smSize: 4,
			mdSize: 8,
			lgSize: 7,
		} );
	} );
} );

/**
 * `useBreakpoint` hook tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { renderHook, actHook as act } from '../../../tests/js/test-utils';
import {
	getViewportWidth,
	setViewportWidth,
} from '../../../tests/js/viewport-width-utils';
import { useBreakpoint } from './useBreakpoint';

describe( 'useBreakpoint', () => {
	let originalViewportWidth;

	beforeEach( () => {
		originalViewportWidth = getViewportWidth();
	} );

	afterEach( () => {
		setViewportWidth( originalViewportWidth );
	} );

	it.each( [
		[ 'should return small if the window width is <= 600px', 600, 'small' ],
		[
			'should return tablet if the window width is > 600px',
			601,
			'tablet',
		],
		[
			'should return tablet if the window width is <= 960px',
			960,
			'tablet',
		],
		[
			'should return desktop if the window width is > 960px',
			961,
			'desktop',
		],
		[
			'should return desktop if the window width is <= 1280px',
			1280,
			'desktop',
		],
		[
			'should return desktop if the window width is > 1280px',
			1281,
			'xlarge',
		],
	] )( '%s', async ( _, viewportWidth, expected ) => {
		let result;
		await act( async () => {
			( { result } = await renderHook( () => {
				setViewportWidth( viewportWidth );

				global.window.dispatchEvent(
					new global.window.Event( 'resize' )
				);
				return useBreakpoint();
			} ) );
		} );

		expect( result.current ).toEqual( expected );
	} );
} );

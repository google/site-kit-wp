/**
 * Scrolling utility function tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { mockElementOffsets } from '../../../tests/js/mock-browser-utils';
import { BREAKPOINT_TABLET, BREAKPOINT_SMALL } from '../hooks/useBreakpoint';
import {
	getStickyHeaderHeightWithoutNav,
	getStickyHeaderHeight,
} from './scroll';

describe( 'scrolling utility functions', () => {
	mockElementOffsets();

	const testCases = {
		'breakpoint is small and header is sticky': {
			breakpoint: BREAKPOINT_SMALL,
			position: 'sticky',
			wpAdminBarHeight: 10,
			googlesitekitHeaderHeight: 20,
			googlesitekitHeaderBottom: 40,
			expectedHeaderHeightWithoutNav: 20,
		},
		'breakpoint is small and header is not sticky': {
			breakpoint: BREAKPOINT_SMALL,
			position: 'static',
			wpAdminBarHeight: 10,
			googlesitekitHeaderHeight: 20,
			googlesitekitHeaderBottom: 40,
			expectedHeaderHeightWithoutNav: 0,
		},
		'breakpoint is not small and header is sticky': {
			breakpoint: BREAKPOINT_TABLET,
			position: 'sticky',
			wpAdminBarHeight: 10,
			googlesitekitHeaderHeight: 20,
			googlesitekitHeaderBottom: 40,
			expectedHeaderHeightWithoutNav: 40,
		},
		'breakpoint is not small and header is sticky, with a negative header bottom':
			{
				breakpoint: BREAKPOINT_TABLET,
				position: 'sticky',
				wpAdminBarHeight: 10,
				googlesitekitHeaderHeight: 20,
				googlesitekitHeaderBottom: -40,
				expectedHeaderHeightWithoutNav: 0,
			},
		'breakpoint is not small and header is not sticky': {
			breakpoint: BREAKPOINT_TABLET,
			position: 'static',
			wpAdminBarHeight: 10,
			googlesitekitHeaderHeight: 20,
			googlesitekitHeaderBottom: 40,
			expectedHeaderHeightWithoutNav: 10,
		},
		// Test cases to exercise handling unexpected values that should not happen in practice.
		'breakpoint is not small and header is sticky, with a null header bottom':
			{
				breakpoint: BREAKPOINT_TABLET,
				position: 'sticky',
				wpAdminBarHeight: 10,
				googlesitekitHeaderHeight: 20,
				googlesitekitHeaderBottom: null,
				expectedHeaderHeightWithoutNav: 0,
			},
		'breakpoint is not small and header is sticky, with NaN for the header bottom':
			{
				breakpoint: BREAKPOINT_TABLET,
				position: 'sticky',
				wpAdminBarHeight: 10,
				googlesitekitHeaderHeight: 20,
				googlesitekitHeaderBottom: NaN,
				expectedHeaderHeightWithoutNav: 0,
			},
		'breakpoint is not small and header is sticky, with Infinity for the header bottom':
			{
				breakpoint: BREAKPOINT_TABLET,
				position: 'sticky',
				wpAdminBarHeight: 10,
				googlesitekitHeaderHeight: 20,
				googlesitekitHeaderBottom: Infinity,
				expectedHeaderHeightWithoutNav: 0,
			},
		'breakpoint is not small and header is sticky, with negative Infinity for the header bottom':
			{
				breakpoint: BREAKPOINT_TABLET,
				position: 'sticky',
				wpAdminBarHeight: 10,
				googlesitekitHeaderHeight: 20,
				googlesitekitHeaderBottom: -Infinity,
				expectedHeaderHeightWithoutNav: 0,
			},
	};

	describe.each( Object.entries( testCases ) )(
		'when %s',
		(
			_,
			{
				breakpoint,
				position,
				wpAdminBarHeight,
				googlesitekitHeaderHeight,
				googlesitekitHeaderBottom,
				expectedHeaderHeightWithoutNav,
			}
		) => {
			describe( 'getStickyHeaderHeightWithoutNav', () => {
				it( 'should return the correct height of the header, without the navigation and entity header', () => {
					document.head.innerHTML = `
            <style>
              #wpadminbar {
                height: ${ wpAdminBarHeight }px;
              }
              .googlesitekit-header {
                height: ${ googlesitekitHeaderHeight }px;
                position: ${ position };
              }
              .googlesitekit-navigation {
                height: 80px;
              }
              .googlesitekit-entity-header {
                height: 160px;
              }
            </style>
          `;
					document.body.innerHTML = `
            <div id="wpadminbar"></div>
            <div class="googlesitekit-header"></div>
            <div class="googlesitekit-navigation"></div>
            <div class="googlesitekit-entity-header"></div>
          `;

					// JSDOM doesn't do any rendering, so getBoundingClientRect() always returns 0, 0, 0, 0.
					// We need to mock it to provide a non-zero value.
					const header = document.querySelector(
						'.googlesitekit-header'
					);
					header.getBoundingClientRect = () => ( {
						top: 0,
						right: 0,
						bottom: googlesitekitHeaderBottom,
						left: 0,
					} );

					const headerHeight =
						getStickyHeaderHeightWithoutNav( breakpoint );

					expect( headerHeight ).toBe(
						expectedHeaderHeightWithoutNav
					);
				} );
			} );

			describe( 'getStickyHeaderHeight', () => {
				const cases = {
					'navigation and entity header are not present': {
						navigationHeight: 0,
						entityHeaderHeight: 0,
					},
					'navigation is present and entity header is not': {
						navigationHeight: 80,
						entityHeaderHeight: 0,
					},
					'navigation is not present and entity header is': {
						navigationHeight: 0,
						entityHeaderHeight: 160,
					},
					'navigation and entity header are both present': {
						navigationHeight: 80,
						entityHeaderHeight: 160,
					},
				};

				it.each( Object.entries( cases ) )(
					'should return the correct height of the header, including the navigation and entity header, when %s',
					( __, { navigationHeight, entityHeaderHeight } ) => {
						document.head.innerHTML = `
              <style>
                #wpadminbar {
                  height: ${ wpAdminBarHeight }px;
                }
                .googlesitekit-header {
                  height: ${ googlesitekitHeaderHeight }px;
                  position: ${ position };
                }
                .googlesitekit-navigation {
                  height: ${ navigationHeight }px;
                }
                .googlesitekit-entity-header {
                  height: ${ entityHeaderHeight }px;
                }
              </style>
            `;
						document.body.innerHTML = `
              <div id="wpadminbar"></div>
              <div class="googlesitekit-header"></div>
            `;
						if ( navigationHeight ) {
							document.body.innerHTML += `
                <div class="googlesitekit-navigation"></div>
              `;
						}
						if ( entityHeaderHeight ) {
							document.body.innerHTML += `
                <div class="googlesitekit-entity-header"></div>
              `;
						}

						// JSDOM doesn't do any rendering, so getBoundingClientRect() always returns 0, 0, 0, 0.
						// We need to mock it to provide a non-zero value.
						const header = document.querySelector(
							'.googlesitekit-header'
						);
						header.getBoundingClientRect = () => ( {
							top: 0,
							right: 0,
							bottom: googlesitekitHeaderBottom,
							left: 0,
						} );

						const headerHeight =
							getStickyHeaderHeight( breakpoint );

						expect( headerHeight ).toBe(
							expectedHeaderHeightWithoutNav +
								navigationHeight +
								entityHeaderHeight
						);
					}
				);
			} );
		}
	);
} );

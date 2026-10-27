/**
 * Navigation `useNavChipHelpers` hook tests.
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
 * Internal dependencies
 */
import {
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_MONETIZATION,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_TRAFFIC,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import * as scrollUtils from '@/js/util/scroll';
import { actHook, renderHook } from '@tests/js/test-utils';
import useNavChipHelpers from './useNavChipHelpers';

const getNavigationalScrollTopSpy = jest.spyOn(
	scrollUtils,
	'getNavigationalScrollTop'
);

describe( 'useNavChipHelpers', () => {
	beforeAll( () => {
		global.history.replaceState = jest.fn();
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	const visibleSections = [
		ANCHOR_ID_KEY_METRICS,
		ANCHOR_ID_TRAFFIC,
		ANCHOR_ID_CONTENT,
		ANCHOR_ID_SPEED,
		ANCHOR_ID_MONETIZATION,
	];

	it( 'should return necessary data and functions', () => {
		const { result } = renderHook(
			() =>
				useNavChipHelpers( {
					visibleSections,
				} ),
			{
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( result.current ).toHaveProperty( 'calculateScrollPosition' );
		expect( result.current ).toHaveProperty( 'defaultChipID' );
		expect( result.current ).toHaveProperty( 'findClosestSection' );
		expect( result.current ).toHaveProperty( 'isValidChipID' );
		expect( result.current ).toHaveProperty( 'scrollToChip' );
		expect( result.current ).toHaveProperty( 'updateURLHash' );
	} );

	describe( 'defaultChipID', () => {
		it( 'should return ANCHOR_ID_KEY_METRICS when key metrics is visible', () => {
			const { result } = renderHook(
				() =>
					useNavChipHelpers( {
						visibleSections,
					} ),
				{
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect( result.current.defaultChipID ).toBe(
				ANCHOR_ID_KEY_METRICS
			);
		} );

		it( 'should return ANCHOR_ID_TRAFFIC if traffic is visible and key metrics is not visible', () => {
			const { result } = renderHook(
				() =>
					useNavChipHelpers( {
						visibleSections: [
							ANCHOR_ID_TRAFFIC,
							ANCHOR_ID_CONTENT,
							ANCHOR_ID_SPEED,
							ANCHOR_ID_MONETIZATION,
						],
					} ),
				{
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect( result.current.defaultChipID ).toBe( ANCHOR_ID_TRAFFIC );
		} );

		it( 'should return first visible section in view-only dashboard', () => {
			const { result } = renderHook(
				() =>
					useNavChipHelpers( {
						visibleSections: [
							ANCHOR_ID_SPEED,
							ANCHOR_ID_MONETIZATION,
						],
					} ),
				{
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
				}
			);

			expect( result.current.defaultChipID ).toBe( ANCHOR_ID_SPEED );
		} );

		it( 'should return empty string if no visible sections', () => {
			const { result } = renderHook(
				() =>
					useNavChipHelpers( {
						visibleSections: [],
					} ),
				{
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
				}
			);

			expect( result.current.defaultChipID ).toBe( '' );
		} );
	} );

	describe( 'isValidChipID', () => {
		it( 'should return true for valid chip IDs', () => {
			const { result } = renderHook(
				() =>
					useNavChipHelpers( {
						visibleSections,
					} ),
				{
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect(
				result.current.isValidChipID( ANCHOR_ID_KEY_METRICS )
			).toBe( true );

			expect( result.current.isValidChipID( ANCHOR_ID_TRAFFIC ) ).toBe(
				true
			);
		} );

		it( 'should return false for invalid chip IDs', () => {
			const { result } = renderHook(
				() =>
					useNavChipHelpers( {
						visibleSections,
					} ),
				{
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect( result.current.isValidChipID( 'not-present' ) ).toBe(
				false
			);
		} );
	} );

	describe( 'calculateScrollPosition', () => {
		it( 'should calculate the scroll position of the widget context rather than another element with the same ID', () => {
			const { result } = renderHook(
				() =>
					useNavChipHelpers( {
						visibleSections,
					} ),
				{
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			result.current.calculateScrollPosition( ANCHOR_ID_SPEED );

			expect( getNavigationalScrollTopSpy ).toHaveBeenCalledWith(
				`.googlesitekit-widget-context#${ ANCHOR_ID_SPEED }`,
				expect.any( String )
			);
		} );
	} );

	describe( 'findClosestSection', () => {
		afterEach( () => {
			document.body.innerHTML = '';
		} );

		it( 'should find the closest section using the widget context rather than another element with the same ID', () => {
			// Another element with the same ID that precedes the widget context
			// in the DOM shouldn't be matched.
			document.body.innerHTML = `
				<div id="${ ANCHOR_ID_SPEED }" class="mdc-chip"></div>
				<div id="${ ANCHOR_ID_SPEED }" class="googlesitekit-widget-context"></div>
			`;

			// JSDOM doesn't do any rendering, so getBoundingClientRect() always returns 0, 0, 0, 0.
			// We need to mock it to place the other element above and the widget context below the navigation.
			const [ otherElement, widgetContext ] = document.querySelectorAll(
				`#${ ANCHOR_ID_SPEED }`
			);
			otherElement.getBoundingClientRect = () => ( { top: -100 } );
			widgetContext.getBoundingClientRect = () => ( { top: 500 } );

			const { result } = renderHook(
				() =>
					useNavChipHelpers( {
						visibleSections,
					} ),
				{
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			const navigationRef = {
				current: { getBoundingClientRect: () => ( { bottom: 0 } ) },
			};

			// The Speed widget context is below the navigation, so the default
			// chip should be the closest section.
			expect( result.current.findClosestSection( navigationRef ) ).toBe(
				ANCHOR_ID_KEY_METRICS
			);
		} );
	} );

	describe( 'updateURLHash', () => {
		it( 'should update the URL hash', () => {
			const { result } = renderHook(
				() =>
					useNavChipHelpers( {
						visibleSections,
					} ),
				{
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			actHook( () => {
				result.current.updateURLHash( 'traffic' );
			} );

			expect( global.history.replaceState ).toHaveBeenCalledWith(
				{},
				'',
				'#traffic'
			);
		} );
	} );
} );

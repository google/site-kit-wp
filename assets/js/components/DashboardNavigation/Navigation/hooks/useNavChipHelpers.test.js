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
} from '../../../../googlesitekit/constants';
import { actHook, renderHook } from '../../../../../../tests/js/test-utils';
import useNavChipHelpers from './useNavChipHelpers';

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

/**
 * UseGoalDriversData hook tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { renderHook } from '../../../../../../../../tests/js/test-utils';
import useGoalDriversData from '@/js/modules/analytics-4/components/site-goals/goal-drivers/hooks/useGoalDriversData';

// These child hooks are mocked intentionally so this test only verifies
// useGoalDriversData composition behavior (merge/order/loading+error),
// without coupling to GA4 datastore resolver behavior.
jest.mock(
	'@/js/modules/analytics-4/components/site-goals/goal-drivers/hooks/useTopTrafficChannelsGoalDriverData',
	() => jest.fn()
);
jest.mock(
	'@/js/modules/analytics-4/components/site-goals/goal-drivers/hooks/useTopPagesGoalDriverData',
	() => jest.fn()
);
jest.mock(
	'@/js/modules/analytics-4/components/site-goals/goal-drivers/hooks/useVisitorTypeGoalDriverData',
	() => jest.fn()
);

import useTopTrafficChannelsGoalDriverData from '@/js/modules/analytics-4/components/site-goals/goal-drivers/hooks/useTopTrafficChannelsGoalDriverData';
import useTopPagesGoalDriverData from '@/js/modules/analytics-4/components/site-goals/goal-drivers/hooks/useTopPagesGoalDriverData';
import useVisitorTypeGoalDriverData from '@/js/modules/analytics-4/components/site-goals/goal-drivers/hooks/useVisitorTypeGoalDriverData';
import type { GoalDriverData } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';

const mockUseTopTrafficChannelsGoalDriverData =
	useTopTrafficChannelsGoalDriverData as jest.MockedFunction<
		typeof useTopTrafficChannelsGoalDriverData
	>;
const mockUseTopPagesGoalDriverData =
	useTopPagesGoalDriverData as jest.MockedFunction<
		typeof useTopPagesGoalDriverData
	>;
const mockUseVisitorTypeGoalDriverData =
	useVisitorTypeGoalDriverData as jest.MockedFunction<
		typeof useVisitorTypeGoalDriverData
	>;

describe( 'useGoalDriversData', () => {
	beforeEach( () => {
		mockUseTopTrafficChannelsGoalDriverData.mockReturnValue( {
			id: 'topTrafficChannels',
			rows: [ { label: 'Direct', value: '60%' } ],
			totalRows: 4,
			loading: false,
			error: undefined,
		} );
		mockUseTopPagesGoalDriverData.mockReturnValue( {
			id: 'topPages',
			rows: [ { label: '/foo', value: '42' } ],
			totalRows: 2,
			loading: false,
			error: undefined,
		} );
		mockUseVisitorTypeGoalDriverData.mockReturnValue( {
			id: 'visitorType',
			rows: [ { label: 'New visitors', value: '50%' } ],
			totalRows: 2,
			loading: true,
			error: undefined,
		} );
	} );

	it( 'composes driver metadata and data in active order', () => {
		const { result } = renderHook( () =>
			useGoalDriversData( {
				goalType: 'lead',
				primaryEvent: [ 'contact' ],
				selectedDriverIDs: [ 'topPages', 'topTrafficChannels' ],
			} )
		);

		expect( result.current.drivers.map( ( driver ) => driver.id ) ).toEqual(
			[ 'topPages', 'topTrafficChannels' ]
		);
		expect( result.current.drivers[ 0 ].rows ).toEqual( [
			{ label: '/foo', value: '42' },
		] );
	} );

	it( 'returns merged loading/error state and expandable rows state', () => {
		const hookError: GoalDriverData[ 'error' ] = {
			code: 'rest_forbidden',
		};
		mockUseTopPagesGoalDriverData.mockReturnValueOnce( {
			id: 'topPages',
			rows: [],
			totalRows: 1,
			loading: false,
			error: hookError,
		} );

		const { result } = renderHook( () =>
			useGoalDriversData( {
				goalType: 'ecommerce',
				primaryEvent: 'purchase',
			} )
		);

		expect( result.current.loading ).toBe( true );
		expect( result.current.error ).toEqual( hookError );
		expect( result.current.hasExpandableRows ).toBe( true );
	} );
} );

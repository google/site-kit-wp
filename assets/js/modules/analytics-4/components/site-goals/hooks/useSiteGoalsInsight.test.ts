/**
 * Site Goals insight hook tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { conversionInsight } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	createTestRegistry,
	freezeFetch,
	renderHook,
	waitFor,
} from '@tests/js/test-utils';
import { waitForDefaultTimeouts } from '@tests/js/utils';
import { useSiteGoalsInsight } from './useSiteGoalsInsight';

describe( 'useSiteGoalsInsight', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		// With this reference date, "Last 28 days" starts on 2026-10-29.
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-11-25' );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
	} );

	it( 'should return the stored insight of the whole widget for the 28 days that end the day before the reference date', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveConversionInsight( conversionInsight, {
				goalType: GOAL_TYPES.LEAD,
				tabID: '',
				endDate: '2026-11-24',
			} );

		const { result } = renderHook(
			() => useSiteGoalsInsight( GOAL_TYPES.LEAD, '' ),
			{ registry }
		);

		expect( result.current ).toEqual( conversionInsight );
	} );

	it( 'should return `undefined` while the insight of the whole widget loads, and request it for the day before the reference date', async () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/conversion-insights'
			)
		);

		const { result } = renderHook(
			() => useSiteGoalsInsight( GOAL_TYPES.LEAD, '' ),
			{ registry }
		);

		expect( result.current ).toBeUndefined();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched(
				new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/conversion-insights'
				),
				{
					body: {
						data: {
							goalType: 'lead',
							tab: '',
							endDate: '2026-11-24',
						},
					},
				}
			)
		);
	} );

	it( 'should request the insight of the whole widget while its breakdown data is still being gathered', async () => {
		// A dimension without data is in the partial data state.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
			resourceAvailabilityDates: {
				customDimension: { googlesitekit_form_id: 0 },
			},
		} );
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/conversion-insights'
			)
		);

		const { result } = renderHook(
			() => useSiteGoalsInsight( GOAL_TYPES.LEAD, '' ),
			{ registry }
		);

		expect( result.current ).toBeUndefined();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes(
				1,
				new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/conversion-insights'
				)
			)
		);
	} );

	it( 'should request the insight of the open tab when its breakdown is not in the partial data state', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
			resourceAvailabilityDates: {
				customDimension: { googlesitekit_form_id: 20260101 },
			},
		} );
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/conversion-insights'
			)
		);

		const { result } = renderHook(
			() => useSiteGoalsInsight( GOAL_TYPES.LEAD, 'contact-form' ),
			{ registry }
		);

		expect( result.current ).toBeUndefined();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched(
				new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/conversion-insights'
				),
				{
					body: {
						data: {
							goalType: 'lead',
							tab: 'contact-form',
							endDate: '2026-11-24',
						},
					},
				}
			)
		);
	} );

	it( 'should return `undefined` and request no insight while it is not known whether the widget has tabs', async () => {
		fetchMock.post(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/conversion-insights'
			),
			{ body: {}, status: 200 }
		);

		const { result } = renderHook(
			() => useSiteGoalsInsight( GOAL_TYPES.LEAD, undefined ),
			{ registry }
		);
		// No selector resolves here, so `waitForRegistry()` would see no change.
		await waitForDefaultTimeouts();

		expect( result.current ).toBeUndefined();
		expect( fetchMock ).not.toHaveFetched(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/conversion-insights'
			)
		);
	} );

	it.each( [
		[
			'the "Last 7 days" preset is selected',
			() =>
				registry.dispatch( CORE_USER ).setDateRangeSelection( {
					type: 'preset',
					slug: 'last-7-days',
				} ),
			'',
		],
		[
			'a custom range of the 28 days that end the day before the reference date is selected',
			() =>
				registry.dispatch( CORE_USER ).setDateRangeSelection( {
					type: 'custom',
					startDate: '2026-10-28',
					endDate: '2026-11-24',
				} ),
			'',
		],
		[
			'the "Other sources" tab is open',
			() =>
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					resourceAvailabilityDates: {
						customDimension: { googlesitekit_form_id: 20260101 },
					},
				} ),
			'other-sources',
		],
		[
			'the breakdown of the open tab is in the partial data state',
			() =>
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					resourceAvailabilityDates: {
						customDimension: { googlesitekit_form_id: 20261101 },
					},
				} ),
			'contact-form',
		],
	] )(
		'should return `false` and request no insight when %s',
		async ( _description, setUp, tabID ) => {
			setUp();
			fetchMock.post(
				new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/conversion-insights'
				),
				{ body: {}, status: 200 }
			);

			const { result } = renderHook(
				() => useSiteGoalsInsight( GOAL_TYPES.LEAD, tabID ),
				{ registry }
			);
			// No selector resolves here, so `waitForRegistry()` would see no change.
			await waitForDefaultTimeouts();

			expect( result.current ).toBe( false );
			expect( fetchMock ).not.toHaveFetched(
				new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/conversion-insights'
				)
			);
		}
	);
} );

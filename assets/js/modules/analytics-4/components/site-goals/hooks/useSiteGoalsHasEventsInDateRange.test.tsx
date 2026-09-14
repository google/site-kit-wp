/**
 * Site Goals events in date range hook tests.
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
import {
	buildSiteGoalsEventCountReportOptions,
	seedSiteGoalsEventCountReport,
} from '@/js/modules/analytics-4/components/site-goals/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { renderHook } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import { useSiteGoalsHasEventsInDateRange } from './useSiteGoalsHasEventsInDateRange';

describe( 'useSiteGoalsHasEventsInDateRange', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
	} );

	it( 'reports events for the ecommerce goal type when the report counts at least one event', () => {
		seedSiteGoalsEventCountReport( registry, GOAL_TYPES.ECOMMERCE, '12' );

		const { result } = renderHook(
			() => useSiteGoalsHasEventsInDateRange( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current ).toBe( true );
	} );

	it( 'reports events for the lead goal type when the report counts at least one event', () => {
		seedSiteGoalsEventCountReport( registry, GOAL_TYPES.LEAD, '3' );

		const { result } = renderHook(
			() => useSiteGoalsHasEventsInDateRange( GOAL_TYPES.LEAD ),
			{ registry }
		);

		expect( result.current ).toBe( true );
	} );

	it( 'reports no ecommerce events when every count in the report is zero', () => {
		seedSiteGoalsEventCountReport( registry, GOAL_TYPES.ECOMMERCE, '0' );

		const { result } = renderHook(
			() => useSiteGoalsHasEventsInDateRange( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( 'reports no ecommerce events when the report has no rows', () => {
		const options = buildSiteGoalsEventCountReportOptions(
			registry,
			GOAL_TYPES.ECOMMERCE
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( { rows: [], totals: [] }, { options } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );

		const { result } = renderHook(
			() => useSiteGoalsHasEventsInDateRange( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( 'returns undefined while the report loads', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [
				buildSiteGoalsEventCountReportOptions(
					registry,
					GOAL_TYPES.ECOMMERCE
				),
			] );

		const { result } = renderHook(
			() => useSiteGoalsHasEventsInDateRange( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current ).toBeUndefined();
	} );

	it( 'returns undefined when the report fails', () => {
		const options = buildSiteGoalsEventCountReportOptions(
			registry,
			GOAL_TYPES.ECOMMERCE
		);

		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			'getReport',
			[ options ]
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );

		const { result } = renderHook(
			() => useSiteGoalsHasEventsInDateRange( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current ).toBeUndefined();
	} );
} );

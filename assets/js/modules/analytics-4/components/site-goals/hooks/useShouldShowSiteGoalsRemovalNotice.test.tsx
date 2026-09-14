/**
 * Site Goals removal notice condition hook tests.
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
import { useShouldShowSiteGoalsRemovalNotice } from './useShouldShowSiteGoalsRemovalNotice';

describe( 'useShouldShowSiteGoalsRemovalNotice', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
	} );

	it( 'shows the removal notice for the ecommerce widget when no ecommerce plugin is active and the selected date range has no ecommerce events', () => {
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: false,
		} );
		seedSiteGoalsEventCountReport( registry, GOAL_TYPES.ECOMMERCE, '0' );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current ).toBe( true );
	} );

	it( 'shows the removal notice for the lead generation widget when no form plugin is active and the selected date range has no lead events', () => {
		provideSiteInfo( registry, {
			hasActiveLeadEventProviders: false,
		} );
		seedSiteGoalsEventCountReport( registry, GOAL_TYPES.LEAD, '0' );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( GOAL_TYPES.LEAD ),
			{ registry }
		);

		expect( result.current ).toBe( true );
	} );

	it( "doesn't show the removal notice for the ecommerce widget when an ecommerce plugin is active and the selected date range has no ecommerce events", () => {
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: true,
		} );
		seedSiteGoalsEventCountReport( registry, GOAL_TYPES.ECOMMERCE, '0' );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( "doesn't show the removal notice for the lead generation widget when a form plugin is active and the selected date range has no lead events", () => {
		provideSiteInfo( registry, {
			hasActiveLeadEventProviders: true,
		} );
		seedSiteGoalsEventCountReport( registry, GOAL_TYPES.LEAD, '0' );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( GOAL_TYPES.LEAD ),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( "doesn't show the removal notice for the ecommerce widget when no ecommerce plugin is active and the selected date range has ecommerce events", () => {
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: false,
		} );
		seedSiteGoalsEventCountReport( registry, GOAL_TYPES.ECOMMERCE, '7' );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( "doesn't show the removal notice for the ecommerce widget when Site Kit doesn't know whether an ecommerce plugin is active", () => {
		provideSiteInfo( registry );
		seedSiteGoalsEventCountReport( registry, GOAL_TYPES.ECOMMERCE, '0' );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( "doesn't show the removal notice for the ecommerce widget when no ecommerce plugin is active and the report of ecommerce events is loading", () => {
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: false,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [
				buildSiteGoalsEventCountReportOptions(
					registry,
					GOAL_TYPES.ECOMMERCE
				),
			] );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( GOAL_TYPES.ECOMMERCE ),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );
} );

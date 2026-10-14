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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	buildSiteGoalsEventCountReportOptions,
	seedSiteGoalsEventCountReport,
} from '@/js/modules/analytics-4/components/site-goals/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { actHook as act, renderHook } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { useShouldShowSiteGoalsRemovalNotice } from './useShouldShowSiteGoalsRemovalNotice';

describe( 'useShouldShowSiteGoalsRemovalNotice', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

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
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			detectedEvents: [ 'purchase', 'contact' ],
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSiteGoalsSettings( {
			activeWidgets: [ 'ecommerce', 'lead' ],
		} );
	} );

	it( 'should show the removal notice for the ecommerce widget when no ecommerce plugin is active and the selected date range has no ecommerce events', () => {
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: false,
		} );
		seedSiteGoalsEventCountReport( registry, 'ecommerce', '0' );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( 'ecommerce' ),
			{ registry }
		);

		expect( result.current ).toBe( true );
	} );

	it( 'should show the removal notice for the lead generation widget when no form plugin is active and the selected date range has no lead events', () => {
		provideSiteInfo( registry, {
			hasActiveLeadEventProviders: false,
		} );
		seedSiteGoalsEventCountReport( registry, 'lead', '0' );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( 'lead' ),
			{ registry }
		);

		expect( result.current ).toBe( true );
	} );

	it( 'should not show the removal notice for the ecommerce widget when an ecommerce plugin is active and the selected date range has no ecommerce events', () => {
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: true,
		} );
		seedSiteGoalsEventCountReport( registry, 'ecommerce', '0' );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( 'ecommerce' ),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( 'should not show the removal notice for the lead generation widget when a form plugin is active and the selected date range has no lead events', () => {
		provideSiteInfo( registry, {
			hasActiveLeadEventProviders: true,
		} );
		seedSiteGoalsEventCountReport( registry, 'lead', '0' );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( 'lead' ),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( 'should not show the removal notice for the ecommerce widget when no ecommerce plugin is active and the selected date range has ecommerce events', () => {
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: false,
		} );
		seedSiteGoalsEventCountReport( registry, 'ecommerce', '7' );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( 'ecommerce' ),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( "should not show the removal notice for the ecommerce widget when Site Kit doesn't know whether an ecommerce plugin is active", () => {
		provideSiteInfo( registry );
		seedSiteGoalsEventCountReport( registry, 'ecommerce', '0' );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( 'ecommerce' ),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( 'should wait to decide on the removal notice for the ecommerce widget when no ecommerce plugin is active and the report of ecommerce events is loading', () => {
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: false,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [
				buildSiteGoalsEventCountReportOptions( registry, 'ecommerce' ),
			] );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( 'ecommerce' ),
			{ registry }
		);

		expect( result.current ).toBeUndefined();
	} );

	it( 'should not show the removal notice for the ecommerce widget or request the report of ecommerce events when an ecommerce plugin is active', async () => {
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: true,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( 'ecommerce' ),
			{ registry }
		);
		await waitForRegistry();

		expect( result.current ).toBe( false );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should not show the removal notice for the ecommerce widget when the widget is out of view and an ecommerce plugin is active', () => {
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: true,
		} );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( 'ecommerce' ),
			{ registry, inView: false }
		);

		expect( result.current ).toBe( false );
	} );

	it( 'should wait to decide on the removal notice without requesting the event report when no ecommerce plugin is active and the widget is out of view', async () => {
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: false,
		} );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( 'ecommerce' ),
			{ registry, inView: false }
		);

		await waitForDefaultTimeouts();

		expect( result.current ).toBeUndefined();
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should wait for the ecommerce widget to come into view before it shows the removal notice, even when the report of ecommerce events has already loaded', () => {
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: false,
		} );
		seedSiteGoalsEventCountReport( registry, 'ecommerce', '0' );

		const { result, setInView } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( 'ecommerce' ),
			{ registry, inView: false }
		);

		expect( result.current ).toBeUndefined();

		act( () => setInView?.( true ) );

		expect( result.current ).toBe( true );
	} );

	it( 'should not show the removal notice for the ecommerce widget when no ecommerce plugin is active and the report of ecommerce events fails', () => {
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: false,
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			'getReport',
			[ buildSiteGoalsEventCountReportOptions( registry, 'ecommerce' ) ]
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [
				buildSiteGoalsEventCountReportOptions( registry, 'ecommerce' ),
			] );

		const { result } = renderHook(
			() => useShouldShowSiteGoalsRemovalNotice( 'ecommerce' ),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );
} );

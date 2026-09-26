/**
 * Site Goals widget content check tests.
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
import { Select } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	buildSiteGoalsEventCountReportOptions,
	seedSiteGoalsEventCountReport,
} from '@/js/modules/analytics-4/components/site-goals/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { freezeFetch, muteFetch, untilResolved } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import { isSiteGoalsWidgetShowingContent } from './isSiteGoalsWidgetShowingContent';

const reportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);
const siteGoalsSettingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/site-goals-settings'
);

describe( 'isSiteGoalsWidgetShowingContent', () => {
	let registry: WPDataRegistry;
	let select: Select;

	beforeEach( () => {
		registry = createTestRegistry();
		select = registry.select as Select;

		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			detectedEvents: [ 'purchase', 'contact' ],
		} );
	} );

	/**
	 * Stores Site Goals settings with the `ecommerce` and `lead` widgets active.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function provideActiveWidgets() {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSiteGoalsSettings( {
			activeWidgets: [ 'ecommerce', 'lead' ],
		} );
	}

	it( "returns `false` for a goal type whose widget isn't active", () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSiteGoalsSettings( {
			activeWidgets: [ 'ecommerce' ],
		} );

		expect( isSiteGoalsWidgetShowingContent( select, 'lead' ) ).toBe(
			false
		);
	} );

	it( 'returns `undefined` while the Site Goals settings load', async () => {
		muteFetch( siteGoalsSettingsEndpoint );

		expect(
			isSiteGoalsWidgetShowingContent( select, 'ecommerce' )
		).toBeUndefined();

		// Wait for the settings request, so it can't finish after fetch-mock
		// resets for the next test.
		await untilResolved(
			registry,
			MODULES_ANALYTICS_4
		).getSiteGoalsSettings();
	} );

	it( 'returns `true` without requesting the event report while a plugin for the goal type is active', () => {
		provideActiveWidgets();
		provideSiteInfo( registry, { hasActiveEcommerceEventProviders: true } );

		expect( isSiteGoalsWidgetShowingContent( select, 'ecommerce' ) ).toBe(
			true
		);
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( "returns `true` while Site Kit doesn't know whether a plugin for the goal type is active", () => {
		provideActiveWidgets();

		expect( isSiteGoalsWidgetShowingContent( select, 'ecommerce' ) ).toBe(
			true
		);
	} );

	it( 'returns `undefined` while no plugin for the goal type is active and the event report loads', () => {
		freezeFetch( reportEndpoint );
		provideActiveWidgets();
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: false,
		} );

		expect(
			isSiteGoalsWidgetShowingContent( select, 'ecommerce' )
		).toBeUndefined();
	} );

	it( 'returns `false` when no plugin for the goal type is active and the event report counts no events', () => {
		provideActiveWidgets();
		provideSiteInfo( registry, { hasActiveLeadEventProviders: false } );
		seedSiteGoalsEventCountReport( registry, 'lead', '0' );

		expect( isSiteGoalsWidgetShowingContent( select, 'lead' ) ).toBe(
			false
		);
	} );

	it( 'returns `true` when no plugin for the goal type is active and the event report counts at least one event', () => {
		provideActiveWidgets();
		provideSiteInfo( registry, { hasActiveLeadEventProviders: false } );
		seedSiteGoalsEventCountReport( registry, 'lead', '12' );

		expect( isSiteGoalsWidgetShowingContent( select, 'lead' ) ).toBe(
			true
		);
	} );

	it( 'returns `true` when no plugin for the goal type is active and the event report fails', () => {
		provideActiveWidgets();
		provideSiteInfo( registry, {
			hasActiveEcommerceEventProviders: false,
		} );

		const options = buildSiteGoalsEventCountReportOptions(
			registry,
			'ecommerce'
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

		expect( isSiteGoalsWidgetShowingContent( select, 'ecommerce' ) ).toBe(
			true
		);
	} );
} );

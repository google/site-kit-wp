/**
 * Reader Revenue Manager `useExpressSetupDashboardSurveyTriggers` hook tests.
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
import { Registry } from '@/js/googlesitekit-data';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_SETUP_NOTIFICATION_ID,
} from '@/js/modules/reader-revenue-manager/constants';
import {
	surveyTimeoutsEndpoint,
	surveyTriggerEndpoint,
} from '@tests/js/mock-survey-endpoints';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	renderHook,
	waitFor,
	waitForDefaultTimeouts,
} from '@tests/js/test-utils';
import useExpressSetupDashboardSurveyTriggers from './useExpressSetupDashboardSurveyTriggers';

describe( 'useExpressSetupDashboardSurveyTriggers', () => {
	const userSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/user-settings'
	);

	const PUBLISHED = 'view_rrm_newsletter-signup_published';
	const INCOMPLETE = 'view_rrm_newsletter-signup_incomplete';
	const NOT_INTERACTED = 'view_rrm_newsletter-signup_not_interacted';

	let registry: Registry;

	function triggeredIDs(): string[] {
		return fetchMock
			.calls( surveyTriggerEndpoint )
			.map(
				( call ) =>
					JSON.parse( String( call[ 1 ]?.body ) ).data.triggerID
			);
	}

	function provideUserSettings( settings: Record< string, unknown > ) {
		fetchMock.get( userSettingsEndpoint, {
			body: {
				lastActionedExpressSetups: {},
				completedExpressSetups: {},
				...settings,
			},
			status: 200,
		} );
	}

	function dismissSetupBannerPermanently() {
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ RRM_SETUP_NOTIFICATION_ID ]: { expires: 0, count: 1 },
		} );
	}

	function render( {
		viewContext = VIEW_CONTEXT_MAIN_DASHBOARD,
		features = [ 'rrmExpressSetup' ],
	}: { viewContext?: string; features?: string[] } = {} ) {
		return renderHook( () => useExpressSetupDashboardSurveyTriggers(), {
			registry,
			viewContext,
			features,
		} );
	}

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideUserAuthentication( registry );
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: true,
			},
		] );

		fetchMock.get( surveyTimeoutsEndpoint, { status: 200, body: [] } );
		fetchMock.post( surveyTriggerEndpoint, { status: 200, body: {} } );
	} );

	it( 'should trigger the published survey when a newsletter sign-up setup is completed', async () => {
		provideUserSettings( {
			completedExpressSetups: { 'newsletter-signup:a1b2c3': 1752451200 },
			lastActionedExpressSetups: { 'newsletter-signup:new': 1752451200 },
		} );
		dismissSetupBannerPermanently();

		const { waitForRegistry } = render();
		await waitForRegistry();

		await waitFor( () =>
			expect( triggeredIDs() ).toEqual( [ PUBLISHED ] )
		);
		expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
			body: { data: { triggerID: PUBLISHED, ttl: 86400 } },
		} );
	} );

	it( 'should trigger the incomplete survey when a newsletter sign-up setup is unfinished', async () => {
		provideUserSettings( {
			lastActionedExpressSetups: { 'newsletter-signup:new': 1752451200 },
		} );
		dismissSetupBannerPermanently();

		const { waitForRegistry } = render();
		await waitForRegistry();

		await waitFor( () =>
			expect( triggeredIDs() ).toEqual( [ INCOMPLETE ] )
		);
	} );

	it( 'should trigger the not interacted survey when the setup banner is dismissed permanently', async () => {
		provideUserSettings( {} );
		dismissSetupBannerPermanently();

		const { waitForRegistry } = render();
		await waitForRegistry();

		await waitFor( () =>
			expect( triggeredIDs() ).toEqual( [ NOT_INTERACTED ] )
		);
	} );

	it( 'should not trigger any survey when the setup banner was not dismissed permanently', async () => {
		provideUserSettings( {} );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ RRM_SETUP_NOTIFICATION_ID ]: {
				expires: Math.floor( Date.now() / 1000 ) + 3600,
				count: 1,
			},
		} );

		const { waitForRegistry } = render();
		await waitForRegistry();

		await waitForDefaultTimeouts();

		expect( triggeredIDs() ).toEqual( [] );
	} );

	it( 'should trigger the not interacted survey without requesting the user settings when RRM is not active', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: false,
				connected: false,
			},
		] );
		dismissSetupBannerPermanently();

		const { waitForRegistry } = render();
		await waitForRegistry();

		await waitFor( () =>
			expect( triggeredIDs() ).toEqual( [ NOT_INTERACTED ] )
		);
		expect( fetchMock ).not.toHaveFetched( userSettingsEndpoint );
	} );

	it( 'should not trigger any survey when the feature flag is disabled', async () => {
		provideUserSettings( {
			completedExpressSetups: { 'newsletter-signup:a1b2c3': 1752451200 },
		} );
		dismissSetupBannerPermanently();

		render( { features: [] } );
		await waitForDefaultTimeouts();

		expect( triggeredIDs() ).toEqual( [] );
		expect( fetchMock ).not.toHaveFetched( userSettingsEndpoint );
	} );

	it( 'should not trigger any survey on the view-only dashboard', async () => {
		provideUserSettings( {
			completedExpressSetups: { 'newsletter-signup:a1b2c3': 1752451200 },
		} );
		dismissSetupBannerPermanently();

		render( {
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );
		await waitForDefaultTimeouts();

		expect( triggeredIDs() ).toEqual( [] );
	} );
} );

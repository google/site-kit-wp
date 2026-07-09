/**
 * SiteGoalsSurveyTriggers tests.
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
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { DAY_IN_SECONDS } from '@/js/util';
import {
	mockSurveyEndpoints,
	surveyTriggerEndpoint,
} from '@tests/js/mock-survey-endpoints';
import {
	createTestRegistry,
	freezeFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
import {
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS,
	SITE_GOALS_SURVEY_TRIGGER_BREAKDOWN_ENABLED,
	SITE_GOALS_SURVEY_TRIGGER_NON_INTERACTED,
	SITE_GOALS_SURVEY_TRIGGER_NO_BREAKDOWN,
} from './constants';
import {
	SITE_GOALS_INTRO_MODAL_BANNER,
	SITE_GOALS_INTRO_MODAL_BANNER_CONFIRMED,
} from './notifications/IntroModalBanner';
import SiteGoalsSurveyTriggers from './SiteGoalsSurveyTriggers';

const analytics4SettingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/settings'
);
const coreModulesListEndpoint = new RegExp(
	'^/google-site-kit/v1/core/modules/data/list'
);

describe( 'SiteGoalsSurveyTriggers', () => {
	let registry: WPDataRegistry;

	interface SetupOptions {
		connected?: boolean;
		dismissedItems?: string[];
		availableCustomDimensions?: string[];
	}

	function setup( {
		connected = true,
		dismissedItems = [],
		availableCustomDimensions = [],
	}: SetupOptions = {} ) {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: connected,
				connected,
			},
		] );
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( dismissedItems );

		// Provide settings only when connected. A disconnected module would
		// fetch `analytics4SettingsEndpoint`, which these tests assert never
		// happens.
		if ( connected ) {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetSettings( { availableCustomDimensions } );
		}
	}

	function renderComponent() {
		return render( <SiteGoalsSurveyTriggers />, { registry } );
	}

	function expectTriggerFetch( triggerID: string ) {
		return waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: {
						triggerID,
						ttl: DAY_IN_SECONDS,
					},
				},
			} )
		);
	}

	afterEach( () => {
		fetchMock.reset();
	} );

	it( 'dispatches no trigger and requests no Analytics data when the module is not connected', async () => {
		setup( { connected: false } );
		mockSurveyEndpoints();

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
		expect( fetchMock ).not.toHaveFetched( analytics4SettingsEndpoint );
	} );

	it( 'dispatches no trigger and requests no Analytics data while the module connection is still loading', async () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		mockSurveyEndpoints();

		// Keep the modules request pending, so `isModuleConnected` stays
		// `undefined`.
		freezeFetch( coreModulesListEndpoint );

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
		expect( fetchMock ).not.toHaveFetched( analytics4SettingsEndpoint );
	} );

	it( 'dispatches no trigger when the user has not seen the intro modal', async () => {
		setup();
		mockSurveyEndpoints();

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
	} );

	it( 'dispatches the non-interacted trigger when the user closed the intro modal without confirming it', async () => {
		setup( {
			dismissedItems: [ SITE_GOALS_INTRO_MODAL_BANNER ],
		} );
		mockSurveyEndpoints();

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();
		await expectTriggerFetch( SITE_GOALS_SURVEY_TRIGGER_NON_INTERACTED );
	} );

	it( 'dispatches the no-breakdown trigger when the user confirmed the intro modal and the custom dimensions are missing', async () => {
		setup( {
			dismissedItems: [
				SITE_GOALS_INTRO_MODAL_BANNER,
				SITE_GOALS_INTRO_MODAL_BANNER_CONFIRMED,
			],
		} );
		mockSurveyEndpoints();

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();
		await expectTriggerFetch( SITE_GOALS_SURVEY_TRIGGER_NO_BREAKDOWN );
	} );

	it( 'dispatches the breakdown-enabled trigger when the custom dimensions exist', async () => {
		setup( {
			availableCustomDimensions: SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS,
		} );
		mockSurveyEndpoints();

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();
		await expectTriggerFetch( SITE_GOALS_SURVEY_TRIGGER_BREAKDOWN_ENABLED );
	} );

	it( 'dispatches only the breakdown-enabled trigger when every segment condition holds', async () => {
		setup( {
			dismissedItems: [
				SITE_GOALS_INTRO_MODAL_BANNER,
				SITE_GOALS_INTRO_MODAL_BANNER_CONFIRMED,
			],
			availableCustomDimensions: SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSIONS,
		} );
		mockSurveyEndpoints();

		const { waitForRegistry } = renderComponent();

		await waitForRegistry();
		await expectTriggerFetch( SITE_GOALS_SURVEY_TRIGGER_BREAKDOWN_ENABLED );

		expect( fetchMock.calls( surveyTriggerEndpoint ) ).toHaveLength( 1 );
	} );
} );

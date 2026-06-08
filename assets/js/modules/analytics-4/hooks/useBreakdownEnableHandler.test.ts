/**
 * Tests for the useBreakdownEnableHandler hook.
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
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY } from '@/js/googlesitekit/widgets/default-areas';
import {
	BREAKDOWN_GOAL_TYPE_FORM_KEY,
	BREAKDOWN_ORIGIN_FORM_KEY,
	BREAKDOWN_ORIGIN_PANEL,
	BREAKDOWN_ORIGIN_WIDGET,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	EDIT_SCOPE,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	actHook,
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	renderHook,
} from '@tests/js/test-utils';
import {
	ALL_CUSTOM_DIMENSIONS,
	useBreakdownEnableHandler,
} from './useBreakdownEnableHandler';

describe( 'useBreakdownEnableHandler', () => {
	let registry: WPDataRegistry;

	const createDimensionEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
	);
	const syncDimensionsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
	);

	function getFormValue( key: string ) {
		return registry
			.select( CORE_FORMS )
			.getValue( FORM_CUSTOM_DIMENSIONS_CREATE, key );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserCapabilities( registry );
		provideModules( registry, [
			{ slug: 'analytics-4', active: true, connected: true },
		] );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: '12345',
			availableCustomDimensions: [],
		} );
		// createCustomDimensions dedupes against key-metric requirements, which
		// read these settings; seed them so they don't trigger network requests.
		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [],
			isWidgetHidden: false,
		} );
		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {} );
	} );

	it( 'triggers the OAuth flow and records the form state when the edit scope is missing', async () => {
		provideUserAuthentication( registry, { grantedScopes: [] } );

		const { result } = renderHook(
			() =>
				useBreakdownEnableHandler(
					BREAKDOWN_ORIGIN_WIDGET,
					GOAL_TYPES.LEAD
				),
			{ registry }
		);

		await actHook( async () => {
			await result.current.onEnable();
		} );

		expect( getFormValue( 'autoSubmit' ) ).toBe( true );
		expect( getFormValue( 'customDimensions' ) ).toEqual(
			ALL_CUSTOM_DIMENSIONS
		);
		expect( getFormValue( BREAKDOWN_ORIGIN_FORM_KEY ) ).toBe(
			BREAKDOWN_ORIGIN_WIDGET
		);
		// The clicked goal type is recorded.
		expect( getFormValue( BREAKDOWN_GOAL_TYPE_FORM_KEY ) ).toBe(
			GOAL_TYPES.LEAD
		);

		const permissionError = registry
			.select( CORE_USER )
			.getPermissionScopeError();
		expect( permissionError?.data?.scopes ).toEqual( [ EDIT_SCOPE ] );
		// On return, the dashboard scrolls back to the Site Goals widget section.
		expect( permissionError?.data?.redirectURL ).toContain(
			`widgetArea=${ AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY }`
		);

		// No dimensions are created before the scope is granted.
		expect( fetchMock ).not.toHaveFetched( createDimensionEndpoint );
	} );

	it( 'creates all dimensions directly and records the triggering instance when the edit scope is granted', async () => {
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
		fetchMock.post( createDimensionEndpoint, ( _url, opts ) => ( {
			body: JSON.parse( opts.body as string ).data,
			status: 200,
		} ) );
		fetchMock.post( syncDimensionsEndpoint, {
			body: ALL_CUSTOM_DIMENSIONS.map( ( parameterName ) => ( {
				parameterName,
			} ) ),
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useBreakdownEnableHandler(
					BREAKDOWN_ORIGIN_PANEL,
					GOAL_TYPES.ECOMMERCE
				),
			{ registry }
		);

		await actHook( async () => {
			await result.current.onEnable();
		} );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( createDimensionEndpoint );

		expect( getFormValue( BREAKDOWN_ORIGIN_FORM_KEY ) ).toBe(
			BREAKDOWN_ORIGIN_PANEL
		);
		expect( getFormValue( BREAKDOWN_GOAL_TYPE_FORM_KEY ) ).toBe(
			GOAL_TYPES.ECOMMERCE
		);
		// The OAuth flow is not initiated when the scope is already granted.
		expect(
			registry.select( CORE_USER ).getPermissionScopeError()
		).toBeNull();
	} );
} );

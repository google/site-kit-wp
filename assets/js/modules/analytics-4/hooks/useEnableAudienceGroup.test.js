/**
 * Analytics useEnableAudienceGroup hook tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
	AUDIENCE_SEGMENTATION_SETUP_FORM,
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '../datastore/constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { availableAudiences as audiencesFixture } from '../datastore/__fixtures__';
import { actHook, renderHook } from '../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	freezeFetch,
	muteFetch,
	provideModules,
	provideUserAuthentication,
	provideUserInfo,
	waitForTimeouts,
} from '../../../../../tests/js/utils';
import useEnableAudienceGroup from './useEnableAudienceGroup';
import { mockSurveyEndpoints } from '../../../../../tests/js/mock-survey-endpoints';

describe( 'useEnableAudienceGroup', () => {
	let registry;
	let enableAudienceGroupSpy;

	const audienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/audience-settings'
	);
	const analyticsSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/settings'
	);
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);
	const syncAvailableAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);
	const expirableItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/set-expirable-item-timers'
	);

	const syncAvailableCustomDimensionsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		enableAudienceGroupSpy = jest.spyOn(
			registry.dispatch( MODULES_ANALYTICS_4 ),
			'enableAudienceGroup'
		);

		fetchMock.postOnce( analyticsSettingsEndpoint, ( url, opts ) => {
			const { data } = JSON.parse( opts.body );
			// Return the same settings passed to the API.
			return { body: data, status: 200 };
		} );

		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		provideUserInfo( registry );

		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableAudiences: null,
			availableCustomDimensions: [ 'googlesitekit_post_type' ],
			propertyID: '123456789',
		} );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: null,
			isAudienceSegmentationWidgetHidden: false,
		} );
	} );

	afterEach( () => {
		enableAudienceGroupSpy.mockRestore();
	} );

	it( 'should return an object with appropriate properties', () => {
		const { result } = renderHook( () => useEnableAudienceGroup(), {
			registry,
		} );

		expect( Object.keys( result.current ) ).toEqual( [
			'apiErrors',
			'failedAudiences',
			'isSaving',
			'onEnableGroups',
		] );

		const { isSaving, onEnableGroups } = result.current;

		expect( typeof isSaving ).toBe( 'boolean' );
		expect( typeof onEnableGroups ).toBe( 'function' );
	} );

	it( 'should set `isSaving` to true when `onEnableGroups` is called', () => {
		freezeFetch( syncAvailableAudiencesEndpoint );

		const { result } = renderHook( () => useEnableAudienceGroup(), {
			registry,
		} );

		const { isSaving, onEnableGroups } = result.current;

		expect( isSaving ).toBe( false );

		actHook( () => {
			onEnableGroups();
		} );

		expect( result.current.isSaving ).toBe( true );
	} );

	it.each( [
		[
			'audiences and custom dimension',
			{ availableAudiences: null, availableCustomDimensions: null },
		],
		[
			'audiences',
			{
				availableAudiences: null,
				availableCustomDimensions: [ 'googlesitekit_post_type' ],
			},
		],
		[
			'custom dimension',
			{
				availableAudiences: audiencesFixture,
				availableCustomDimensions: null,
			},
		],
	] )(
		'should set permission scope error when `onEnableGroups` is called but the user does not have the required scope and %s',
		async ( _, settings ) => {
			provideUserAuthentication( registry, {
				grantedScopes: [],
			} );

			registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( settings );

			fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
				status: 200,
				body: [],
			} );

			fetchMock.postOnce( syncAvailableCustomDimensionsEndpoint, {
				body: [],
				status: 200,
			} );

			const { result } = renderHook( () => useEnableAudienceGroup(), {
				registry,
			} );

			const { onEnableGroups } = result.current;

			await actHook( async () => {
				await onEnableGroups();
			} );

			const { message } = registry
				.select( CORE_USER )
				.getPermissionScopeError();

			expect( message ).toBe(
				'Additional permissions are required to create new audiences in Analytics.'
			);

			expect( enableAudienceGroupSpy ).not.toHaveBeenCalled();
		}
	);

	it( 'should not set permission scope error when `onEnableGroups` is called and the user does not have the required scope, but has required audiences and custom dimension', async () => {
		provideUserAuthentication( registry, {
			grantedScopes: [],
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableAudiences: audiencesFixture,
			availableCustomDimensions: [ 'googlesitekit_post_type' ],
		} );

		fetchMock.post( syncAvailableAudiencesEndpoint, {
			status: 200,
			body: audiencesFixture,
		} );

		fetchMock.post( syncAvailableCustomDimensionsEndpoint, {
			body: [ 'googlesitekit_post_type' ],
			status: 200,
		} );

		fetchMock.postOnce( audienceSettingsEndpoint, {
			status: 200,
			body: {
				configuredAudiences: [
					audiencesFixture[ 3 ].name,
					audiencesFixture[ 4 ].name,
				],
				isAudienceSegmentationWidgetHidden: false,
			},
		} );

		muteFetch( reportEndpoint );
		muteFetch( expirableItemEndpoint );

		mockSurveyEndpoints();

		const { result } = renderHook( () => useEnableAudienceGroup(), {
			registry,
		} );

		const { onEnableGroups } = result.current;

		await actHook( async () => {
			await onEnableGroups();
		} );

		expect(
			registry.select( CORE_USER ).getPermissionScopeError()
		).toBeNull();

		expect( enableAudienceGroupSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should automatically call `onEnableGroups` function when user returns from the OAuth screen', async () => {
		fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
			status: 200,
			body: audiencesFixture,
		} );

		fetchMock.postOnce( syncAvailableCustomDimensionsEndpoint, {
			body: [ 'googlesitekit_post_type' ],
			status: 200,
		} );

		fetchMock.postOnce( audienceSettingsEndpoint, {
			status: 200,
			body: {
				configuredAudiences: [
					audiencesFixture[ 3 ].name,
					audiencesFixture[ 4 ].name,
				],
				isAudienceSegmentationWidgetHidden: false,
			},
		} );

		muteFetch( reportEndpoint );
		muteFetch( expirableItemEndpoint );

		mockSurveyEndpoints();

		// Set autoSubmit to true.
		registry
			.dispatch( CORE_FORMS )
			.setValues( AUDIENCE_SEGMENTATION_SETUP_FORM, {
				autoSubmit: true,
			} );

		// eslint-disable-next-line require-await
		await actHook( async () => {
			renderHook( () => useEnableAudienceGroup(), {
				registry,
			} );
		} );

		expect( enableAudienceGroupSpy ).toHaveBeenCalledTimes( 1 );

		await actHook( () => waitForTimeouts( 30 ) );
	} );

	it( 'should dispatch the `enableAudienceGroup` action when `onEnableGroups` is called', async () => {
		fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
			status: 200,
			body: audiencesFixture,
		} );

		fetchMock.postOnce( syncAvailableCustomDimensionsEndpoint, {
			body: [ 'googlesitekit_post_type' ],
			status: 200,
		} );

		fetchMock.postOnce( audienceSettingsEndpoint, {
			status: 200,
			body: {
				configuredAudiences: [
					audiencesFixture[ 3 ].name,
					audiencesFixture[ 4 ].name,
				],
				isAudienceSegmentationWidgetHidden: false,
			},
		} );

		muteFetch( reportEndpoint );
		muteFetch( expirableItemEndpoint );

		mockSurveyEndpoints();

		const { result } = renderHook( () => useEnableAudienceGroup(), {
			registry,
		} );

		const { onEnableGroups } = result.current;

		await actHook( async () => {
			await onEnableGroups();
		} );

		expect( enableAudienceGroupSpy ).toHaveBeenCalledTimes( 1 );

		await actHook( () => waitForTimeouts( 30 ) );
	} );
} );

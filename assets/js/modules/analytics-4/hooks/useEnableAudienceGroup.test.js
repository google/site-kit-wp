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
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { EDIT_SCOPE, MODULES_ANALYTICS_4 } from '../datastore/constants';
import { availableAudiences as audiencesFixture } from '../datastore/__fixtures__';
import { actHook, renderHook } from '../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	freezeFetch,
	muteFetch,
	provideModules,
	provideUserAuthentication,
} from '../../../../../tests/js/utils';
import useEnableAudienceGroup from './useEnableAudienceGroup';

describe( 'useEnableAudienceGroup', () => {
	let registry;
	let enableAudienceGroupSpy;

	const syncAvailableAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		enableAudienceGroupSpy = jest.spyOn(
			registry.dispatch( MODULES_ANALYTICS_4 ),
			'enableAudienceGroup'
		);

		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
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

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: null,
			isAudienceSegmentationWidgetHidden: false,
		} );
	} );

	afterEach( () => {
		enableAudienceGroupSpy.mockRestore();
	} );

	it( 'should return an object containing the `isSaving` state and `onEnableGroups` callback function', () => {
		const { result } = renderHook( () => useEnableAudienceGroup(), {
			registry,
		} );

		expect( Object.keys( result.current ) ).toEqual( [
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

	it( 'should set permissions scope error when `onEnableGroups` is called but the user does not have the required scope', () => {
		provideUserAuthentication( registry, {
			grantedScopes: [],
		} );

		const { result } = renderHook( () => useEnableAudienceGroup(), {
			registry,
		} );

		const { onEnableGroups } = result.current;

		actHook( () => {
			onEnableGroups();
		} );

		const { message } = registry
			.select( CORE_USER )
			.getPermissionScopeError();

		expect( message ).toBe(
			'Additional permissions are required to create new audiences in Analytics.'
		);

		expect( enableAudienceGroupSpy ).not.toHaveBeenCalled();
	} );

	it( 'should dispatch the `enableAudienceGroup` action when `onEnableGroups` is called', () => {
		fetchMock.post( syncAvailableAudiencesEndpoint, {
			status: 200,
			body: audiencesFixture,
		} );

		muteFetch( reportEndpoint );

		const { result } = renderHook( () => useEnableAudienceGroup(), {
			registry,
		} );

		const { onEnableGroups } = result.current;

		actHook( () => {
			onEnableGroups();
		} );

		expect( enableAudienceGroupSpy ).toHaveBeenCalledTimes( 1 );
	} );
} );

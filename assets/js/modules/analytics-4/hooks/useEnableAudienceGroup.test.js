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
import { actHook, renderHook } from '../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideUserAuthentication,
} from '../../../../../tests/js/utils';
import useEnableAudienceGroup from './useEnableAudienceGroup';

describe( 'useEnableAudienceGroup', () => {
	let registry;
	let enableAudienceGroupSpy;

	beforeEach( () => {
		registry = createTestRegistry();

		enableAudienceGroupSpy = jest.spyOn(
			registry.dispatch( MODULES_ANALYTICS_4 ),
			'enableAudienceGroup'
		);

		enableAudienceGroupSpy.mockImplementation( () => Promise.resolve() );

		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
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

	it( 'should automatically call `onEnableGroups` function when user returns from the OAuth screen', () => {
		// Set autoSubmit to true.
		registry
			.dispatch( CORE_FORMS )
			.setValues( AUDIENCE_SEGMENTATION_SETUP_FORM, {
				autoSubmit: true,
			} );

		actHook( () => {
			renderHook( () => useEnableAudienceGroup(), {
				registry,
			} );
		} );

		expect( enableAudienceGroupSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should dispatch the `enableAudienceGroup` action when `onEnableGroups` is called', () => {
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

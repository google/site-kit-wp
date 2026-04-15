/**
 * Audience Segmentation `useCreateCustomDimension` hook tests.
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
 * Internal dependencies
 */
import {
	actHook,
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
	renderHook,
} from '../../../../../../../../../tests/js/test-utils';

import useCreateCustomDimension from './useCreateCustomDimension';
import {
	AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '@/js/util/errors';

describe( 'useCreateCustomDimension', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- registry type is not typed yet.
	let registry: any;

	const propertyID = '12345';

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );

		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID,
		} );
	} );

	describe( 'showErrorModal', () => {
		it( 'defaults to false', async () => {
			const { result } = await renderHook(
				() => useCreateCustomDimension(),
				{ registry }
			);

			expect( result.current.showErrorModal ).toBe( false );
		} );

		it( 'returns true after setShowErrorModal( true ) is called', async () => {
			const { result } = await renderHook(
				() => useCreateCustomDimension(),
				{ registry }
			);

			actHook( () => {
				result.current.setShowErrorModal( true );
			} );

			expect( result.current.showErrorModal ).toBe( true );
		} );

		it( 'returns false after setShowErrorModal( false ) is called', async () => {
			const { result } = await renderHook(
				() => useCreateCustomDimension(),
				{ registry }
			);

			actHook( () => {
				result.current.setShowErrorModal( true );
			} );

			actHook( () => {
				result.current.setShowErrorModal( false );
			} );

			expect( result.current.showErrorModal ).toBe( false );
		} );

		it( 'reflects CORE_UI value set before render', async () => {
			registry
				.dispatch( CORE_UI )
				.setValue( 'audience-tiles-show-error-modal', true );

			const { result } = await renderHook(
				() => useCreateCustomDimension(),
				{ registry }
			);

			expect( result.current.showErrorModal ).toBe( true );
		} );
	} );

	describe( 'onCreateCustomDimension', () => {
		it( 'sets autoSubmit to true in CORE_FORMS', async () => {
			const { result } = await renderHook(
				() => useCreateCustomDimension(),
				{ registry }
			);

			actHook( () => {
				result.current.onCreateCustomDimension();
			} );

			const autoSubmit = registry
				.select( CORE_FORMS )
				.getValue(
					AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
					'autoSubmit'
				);

			expect( autoSubmit ).toBe( true );
		} );

		it( 'sets isRetrying when called with { isRetrying: true }', async () => {
			const { result } = await renderHook(
				() => useCreateCustomDimension(),
				{ registry }
			);

			actHook( () => {
				result.current.onCreateCustomDimension( { isRetrying: true } );
			} );

			const isRetrying = registry
				.select( CORE_FORMS )
				.getValue(
					AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
					'isRetrying'
				);

			expect( isRetrying ).toBe( true );
		} );

		it( 'does not set permission scope error when user already has analytics edit scope', async () => {
			provideUserAuthentication( registry, {
				grantedScopes: [ EDIT_SCOPE ],
			} );

			const { result } = await renderHook(
				() => useCreateCustomDimension(),
				{ registry }
			);

			actHook( () => {
				result.current.onCreateCustomDimension();
			} );

			const scopeError = registry
				.select( CORE_USER )
				.getPermissionScopeError();

			expect( scopeError ).toBeNull();
		} );

		it( 'sets permission scope error when user does not have analytics edit scope', async () => {
			provideUserAuthentication( registry, {
				grantedScopes: [],
			} );

			const { result } = await renderHook(
				() => useCreateCustomDimension(),
				{ registry }
			);

			actHook( () => {
				result.current.onCreateCustomDimension();
			} );

			const scopeError = registry
				.select( CORE_USER )
				.getPermissionScopeError();

			expect( scopeError ).not.toBeNull();
			expect( scopeError.code ).toBe( ERROR_CODE_MISSING_REQUIRED_SCOPE );
			expect( scopeError.data.scopes ).toContain( EDIT_SCOPE );
		} );
	} );

	describe( 'isSaving', () => {
		it( 'returns false initially', async () => {
			const { result } = await renderHook(
				() => useCreateCustomDimension(),
				{ registry }
			);

			expect( result.current.isSaving ).toBe( false );
		} );

		it( 'returns true when isAutoCreatingCustomDimensionsForAudience form value is true', async () => {
			registry
				.dispatch( CORE_FORMS )
				.setValues( AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE, {
					isAutoCreatingCustomDimensionsForAudience: true,
				} );

			const { result } = await renderHook(
				() => useCreateCustomDimension(),
				{ registry }
			);

			expect( result.current.isSaving ).toBe( true );
		} );

		it( 'returns false when isAutoCreatingCustomDimensionsForAudience form value is false', async () => {
			registry
				.dispatch( CORE_FORMS )
				.setValues( AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE, {
					isAutoCreatingCustomDimensionsForAudience: false,
				} );

			const { result } = await renderHook(
				() => useCreateCustomDimension(),
				{ registry }
			);

			expect( result.current.isSaving ).toBe( false );
		} );

		it( 'returns true when syncing available custom dimensions is in progress', async () => {
			fetchMock.postOnce(
				new RegExp( 'analytics-4/data/sync-custom-dimensions' ),
				new Promise( () => {} )
			);

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.fetchSyncAvailableCustomDimensions();

			const { result } = await renderHook(
				() => useCreateCustomDimension(),
				{ registry }
			);

			expect( result.current.isSaving ).toBe( true );
		} );
	} );
} );

/**
 * Analytics useCreateCustomDimensionsEffect hook tests.
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
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	EDIT_SCOPE,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { render, waitFor } from '../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
} from '../../../../../tests/js/utils';
import useCreateCustomDimensionsEffect from './useCreateCustomDimensionsEffect';

function TestComponent() {
	useCreateCustomDimensionsEffect();

	return null;
}

describe( 'useCreateCustomDimensionsEffect', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( CORE_SITE ).setKeyMetricsSetupCompletedBy( 0 );
		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [],
			isWidgetHidden: false,
		} );
		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			purpose: { values: [], scope: 'site' },
			postFrequency: { values: [], scope: 'user' },
			goals: { values: [], scope: 'user' },
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID: '12345',
			availableCustomDimensions: [],
		} );
	} );

	it( 'creates explicit custom dimensions after OAuth even when key metrics setup is not completed', async () => {
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				autoSubmit: true,
				customDimensions: [ 'googlesitekit_post_author' ],
			} );

		fetchMock.postOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
			),
			{
				body: {
					parameterName: 'googlesitekit_post_author',
					displayName: 'WordPress Post Author',
					description:
						'Created by Site Kit: WordPress name of the post author',
					scope: 'EVENT',
				},
				status: 200,
			}
		);
		fetchMock.postOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
			),
			{
				body: [ 'googlesitekit_post_author' ],
				status: 200,
			}
		);

		render( <TestComponent />, { registry } );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetchedTimes( 2 );
		} );

		expect(
			registry
				.select( CORE_FORMS )
				.getValue( FORM_CUSTOM_DIMENSIONS_CREATE, 'autoSubmit' )
		).toBe( false );
		expect(
			registry
				.select( CORE_FORMS )
				.getValue(
					FORM_CUSTOM_DIMENSIONS_CREATE,
					'isAutoCreatingCustomDimensions'
				)
		).toBe( false );
		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getAvailableCustomDimensions()
		).toEqual( [ 'googlesitekit_post_author' ] );
	} );
} );

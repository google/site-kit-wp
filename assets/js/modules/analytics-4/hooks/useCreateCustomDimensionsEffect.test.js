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
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ALL_CUSTOM_DIMENSIONS,
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
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID: '12345',
			availableCustomDimensions: [],
		} );
		// Set the selected property's custom dimensions in the store, so
		// createCustomDimensions reads them instead of fetching the
		// custom-dimensions endpoint.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetCustomDimensions( [], { propertyID: '12345' } );
	} );

	it( 'creates every custom dimension after OAuth for an explicit request, even when key metrics setup is not completed', async () => {
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				autoSubmit: true,
				customDimensions: [ 'googlesitekit_post_author' ],
			} );

		const createEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
		);
		// Respond to each create request with the dimension it was sent.
		fetchMock.post( createEndpoint, ( _url, { body } ) => ( {
			body: JSON.parse( body ).data.customDimension,
			status: 200,
		} ) );
		fetchMock.postOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
			),
			{
				body: ALL_CUSTOM_DIMENSIONS,
				status: 200,
			}
		);

		render( <TestComponent />, { registry } );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetchedTimes(
				ALL_CUSTOM_DIMENSIONS.length + 1
			);
		} );

		expect( fetchMock ).toHaveFetchedTimes(
			ALL_CUSTOM_DIMENSIONS.length,
			createEndpoint
		);

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
		).toEqual( ALL_CUSTOM_DIMENSIONS );
	} );
} );

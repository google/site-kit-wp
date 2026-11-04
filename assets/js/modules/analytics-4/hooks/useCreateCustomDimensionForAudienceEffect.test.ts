/**
 * Tests for the useCreateCustomDimensionForAudienceEffect hook.
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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ALL_CUSTOM_DIMENSIONS,
	AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
	renderHook,
} from '@tests/js/test-utils';
import useCreateCustomDimensionForAudienceEffect from './useCreateCustomDimensionForAudienceEffect';

const createEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
);
const syncEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
);
const conversionTrackingEndpoint = new RegExp(
	'^/google-site-kit/v1/core/site/data/conversion-tracking'
);

describe( 'useCreateCustomDimensionForAudienceEffect', () => {
	let registry: WPDataRegistry;

	function getFormValue( key: string ) {
		return registry
			.select( CORE_FORMS )
			.getValue( AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE, key );
	}

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
		registry
			.dispatch( CORE_SITE )
			.receiveGetConversionTrackingSettings( { enabled: false } );
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
		registry
			.dispatch( CORE_FORMS )
			.setValues( AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE, {
				autoSubmit: true,
				isRetrying: true,
			} );
	} );

	it( 'creates every custom dimension and leaves plugin conversion tracking off', async () => {
		// Respond to each create request with the dimension it was sent.
		fetchMock.post( createEndpoint, ( _url, { body } ) => ( {
			body: JSON.parse( body as string ).data.customDimension,
			status: 200,
		} ) );
		fetchMock.postOnce( syncEndpoint, {
			body: ALL_CUSTOM_DIMENSIONS,
			status: 200,
		} );

		const { waitForValueToChange } = renderHook(
			() => useCreateCustomDimensionForAudienceEffect(),
			{ registry }
		);

		// The flag is set on mount, and cleared once creation settles.
		await waitForValueToChange( () =>
			getFormValue( 'isAutoCreatingCustomDimensionsForAudience' )
		);

		const createdDimensionNames = fetchMock
			.calls( createEndpoint )
			.map(
				( [ , request ] ) =>
					JSON.parse( request?.body as string ).data.customDimension
						.parameterName
			);

		expect( createdDimensionNames ).toEqual( ALL_CUSTOM_DIMENSIONS );
		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getAvailableCustomDimensions()
		).toEqual( ALL_CUSTOM_DIMENSIONS );

		expect( fetchMock ).not.toHaveFetched( conversionTrackingEndpoint );
		expect(
			registry.select( CORE_SITE ).isConversionTrackingEnabled()
		).toBe( false );

		expect( getFormValue( 'autoSubmit' ) ).toBe( false );
		expect(
			getFormValue( 'isAutoCreatingCustomDimensionsForAudience' )
		).toBe( false );
		expect( getFormValue( 'isRetrying' ) ).toBe( false );
	} );

	it( 'clears its form values once creation settles, when creation fails', async () => {
		fetchMock.post( createEndpoint, {
			body: { code: 'internal_error', message: 'Something went wrong' },
			status: 500,
		} );
		fetchMock.postOnce( syncEndpoint, {
			body: [],
			status: 200,
		} );

		const { waitForValueToChange } = renderHook(
			() => useCreateCustomDimensionForAudienceEffect(),
			{ registry }
		);

		// The flag is set on mount, and cleared once creation settles.
		await waitForValueToChange( () =>
			getFormValue( 'isAutoCreatingCustomDimensionsForAudience' )
		);

		expect(
			getFormValue( 'isAutoCreatingCustomDimensionsForAudience' )
		).toBe( false );

		expect( getFormValue( 'autoSubmit' ) ).toBe( false );
		expect( getFormValue( 'isRetrying' ) ).toBe( false );
		ALL_CUSTOM_DIMENSIONS.forEach( ( customDimension ) => {
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getCreateCustomDimensionError( customDimension )
			).toBeDefined();
		} );
		expect( console ).toHaveErrored();
	} );
} );

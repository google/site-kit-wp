/**
 * Analytics useCustomDimensionsData hook tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { renderHook } from '../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
	provideUserCapabilities,
} from '../../../../../tests/js/utils';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import {
	EDIT_SCOPE,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { KEY_METRICS_WIDGETS } from '@/js/components/KeyMetrics/key-metrics-widgets';
import useCustomDimensionsData from './useCustomDimensionsData';
import { provideCustomDimensionError } from '@/js/modules/analytics-4/utils/custom-dimensions';

describe( 'useCustomDimensionsData', () => {
	let registry;
	const customDimension = 'test_custom_dimension';
	const propertyID = '123456789';

	const mockWidgetSlug = 'testWidget';
	const mockDimensions = [ customDimension ];
	const mockReportOptions = {
		startDate: '2023-01-01',
		endDate: '2023-01-31',
	};

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		KEY_METRICS_WIDGETS[ mockWidgetSlug ] = {
			requiredCustomDimensions: [ 'required1', 'required2' ],
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsCustomDimensionGatheringData( customDimension, false );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperty(
			{
				createTime: '2014-10-02T15:01:23Z',
			},
			{ propertyID }
		);
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [ customDimension ],
		} );

		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {} );
	} );

	afterEach( () => {
		delete KEY_METRICS_WIDGETS[ mockWidgetSlug ];
	} );

	it( 'should use provided dimensions over widget required dimensions', () => {
		const { result } = renderHook(
			() =>
				useCustomDimensionsData( {
					dimensions: mockDimensions,
					widgetSlug: mockWidgetSlug,
					reportOptions: mockReportOptions,
				} ),
			{ registry }
		);

		expect( result.current.customDimensions ).toEqual( mockDimensions );
	} );

	it( 'should use widget required dimensions when no dimensions provided', () => {
		const { result } = renderHook(
			() =>
				useCustomDimensionsData( {
					widgetSlug: mockWidgetSlug,
					reportOptions: mockReportOptions,
				} ),
			{ registry }
		);

		expect( result.current.customDimensions ).toEqual( [
			'required1',
			'required2',
		] );
	} );

	it( 'should return null for the custom dimensions when custom dimensions are not available', () => {
		const { result } = renderHook(
			() =>
				useCustomDimensionsData( {
					widgetSlug: 'nonExistentWidget',
					reportOptions: mockReportOptions,
				} ),
			{ registry }
		);

		expect( result.current.customDimensions ).toBeNull();
	} );

	it( 'should indicate the custom dimensions are available when they exist', () => {
		const { result } = renderHook(
			() =>
				useCustomDimensionsData( {
					dimensions: mockDimensions,
					widgetSlug: mockWidgetSlug,
					reportOptions: mockReportOptions,
				} ),
			{ registry }
		);

		expect( result.current.hasCustomDimensions ).toBe( true );
	} );

	it( 'should indicate the custom dimensions are not available when missing', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID,
			availableCustomDimensions: [],
		} );

		const { result } = renderHook(
			() =>
				useCustomDimensionsData( {
					dimensions: mockDimensions,
					widgetSlug: mockWidgetSlug,
					reportOptions: mockReportOptions,
				} ),
			{ registry }
		);

		expect( result.current.hasCustomDimensions ).toBe( false );
	} );

	it( 'should handle the loading states correctly', () => {
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				isAutoCreatingCustomDimensions: true,
			} );

		const { result } = renderHook(
			() =>
				useCustomDimensionsData( {
					dimensions: mockDimensions,
					widgetSlug: mockWidgetSlug,
					reportOptions: mockReportOptions,
				} ),
			{ registry }
		);

		expect( result.current.loading ).toBe( true );
		expect( result.current.isCreatingCustomDimensions ).toBe( true );
	} );

	it( 'should handle the auto-creating custom dimensions state', () => {
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
				isAutoCreatingCustomDimensions: true,
			} );

		const { result } = renderHook(
			() =>
				useCustomDimensionsData( {
					dimensions: mockDimensions,
					widgetSlug: mockWidgetSlug,
					reportOptions: mockReportOptions,
				} ),
			{ registry }
		);

		expect( result.current.isAutoCreatingCustomDimensions ).toBe( true );
		expect( result.current.isCreatingCustomDimensions ).toBe( true );
	} );

	it( 'should handle the custom dimensions creation errors', () => {
		const error = { message: 'Test error' };

		provideCustomDimensionError( registry, {
			customDimension,
			error,
		} );

		const { result } = renderHook(
			() =>
				useCustomDimensionsData( {
					dimensions: mockDimensions,
					widgetSlug: mockWidgetSlug,
					reportOptions: mockReportOptions,
				} ),
			{ registry }
		);

		expect( result.current.customDimensionsCreationErrors ).toContain(
			error
		);
	} );

	it( 'should handle the scope checking correctly', () => {
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		const { result } = renderHook(
			() =>
				useCustomDimensionsData( {
					dimensions: mockDimensions,
					widgetSlug: mockWidgetSlug,
					reportOptions: mockReportOptions,
				} ),
			{ registry }
		);

		expect( result.current.hasAnalyticsEditScope ).toBe( true );
	} );

	it( 'should handle the report options as a function', () => {
		const reportOptionsFunc = jest.fn( () => mockReportOptions );

		const { result } = renderHook(
			() =>
				useCustomDimensionsData( {
					dimensions: mockDimensions,
					widgetSlug: mockWidgetSlug,
					reportOptions: reportOptionsFunc,
				} ),
			{ registry }
		);

		expect( reportOptionsFunc ).toHaveBeenCalled();
		expect( result.current.reportOptions ).toEqual( mockReportOptions );
	} );

	it( 'should handle the gathering data state', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );

		const { result } = renderHook(
			() =>
				useCustomDimensionsData( {
					dimensions: mockDimensions,
					widgetSlug: mockWidgetSlug,
					reportOptions: mockReportOptions,
				} ),
			{ registry }
		);

		expect( result.current.isGatheringData ).toBe( true );
	} );

	it( 'should return the correct redirect URL', () => {
		const { result } = renderHook(
			() =>
				useCustomDimensionsData( {
					dimensions: mockDimensions,
					widgetSlug: mockWidgetSlug,
					reportOptions: mockReportOptions,
				} ),
			{ registry }
		);

		expect( result.current.redirectURL ).toContain(
			'notification=custom_dimensions'
		);
	} );
} );

/**
 * TopAuthorsGoalDriver component tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	EDIT_SCOPE,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	fireEvent,
	render,
	waitFor,
} from '../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
	waitForDefaultTimeouts,
} from '../../../../../../../tests/js/utils';
import { GOAL_DRIVER_ROW_LIMIT_EXPANDED } from './constants';
import TopAuthorsGoalDriver from './TopAuthorsGoalDriver';

describe( 'TopAuthorsGoalDriver', () => {
	it( 'renders missing custom dimensions state and starts setup flow on update', async () => {
		const registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID: '12345',
			availableCustomDimensions: [],
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperty(
			{
				createTime: '2014-10-02T15:01:23Z',
			},
			{ propertyID: '12345' }
		);

		const { getByRole, getByText } = render(
			<TopAuthorsGoalDriver
				goalType="ecommerce"
				title="Top authors driving sales"
				primaryEvent="purchase"
			/>,
			{ registry }
		);

		await waitForDefaultTimeouts();

		expect( getByText( 'No data to show' ) ).toBeInTheDocument();
		expect(
			getByText( 'Update Analytics to track metric' )
		).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: 'Update' } ) );

		expect(
			registry
				.select( CORE_FORMS )
				.getValue( FORM_CUSTOM_DIMENSIONS_CREATE, 'customDimensions' )
		).toEqual( [ 'googlesitekit_post_author' ] );
		expect(
			registry
				.select( CORE_FORMS )
				.getValue( FORM_CUSTOM_DIMENSIONS_CREATE, 'autoSubmit' )
		).toBe( true );
		expect(
			registry.select( CORE_USER ).getPermissionScopeError()
		).toMatchObject( {
			data: {
				scopes: [ EDIT_SCOPE ],
				skipModal: true,
			},
		} );
	} );

	it( 'creates the author custom dimension when update is clicked with edit scope', async () => {
		const registry = createTestRegistry();

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
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [],
			isWidgetHidden: false,
		} );
		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			purpose: { values: [], scope: 'site' },
			postFrequency: { values: [], scope: 'user' },
			goals: { values: [], scope: 'user' },
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
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
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperty(
			{
				createTime: '2014-10-02T15:01:23Z',
			},
			{ propertyID: '12345' }
		);

		fetchMock.postOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
			),
			{
				body: {
					parameterName: 'googlesitekit_post_author',
					displayName: 'Post author',
					description: 'Post author',
					scope: 'EVENT',
					disallowAdsPersonalization: true,
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
		// Once the custom dimension is created, the driver becomes able to
		// load its reports (the ranked list and the site-wide total) - their
		// content isn't under test here, so an empty response is enough to
		// avoid an unmatched-request console error.
		fetchMock.get(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/report'
			),
			{ body: {}, status: 200 }
		);

		const { getByRole } = render(
			<TopAuthorsGoalDriver
				goalType="ecommerce"
				title="Top authors driving sales"
				primaryEvent="purchase"
			/>,
			{ registry }
		);

		await waitForDefaultTimeouts();

		fireEvent.click( getByRole( 'button', { name: 'Update' } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetchedTimes( 2 );
		} );

		expect( fetchMock ).toHaveFetched(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/create-custom-dimension'
			)
		);
		expect(
			registry.select( CORE_USER ).getPermissionScopeError()
		).toBeNull();
		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getAvailableCustomDimensions()
		).toEqual( [ 'googlesitekit_post_author' ] );
		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.isCustomDimensionGatheringData( 'googlesitekit_post_author' )
		).toBe( true );
	} );

	it( "renders each author's share of the site-wide total as a percentage", async () => {
		const registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID: '12345',
			availableCustomDimensions: [ 'googlesitekit_post_author' ],
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsCustomDimensionGatheringData( {
				customDimension: 'googlesitekit_post_author',
				gatheringData: false,
			} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperty(
			{
				createTime: '2014-10-02T15:01:23Z',
			},
			{ propertyID: '12345' }
		);

		const dates = registry.select( CORE_USER ).getDateRangeDates();
		const authorsReportOptions = {
			...dates,
			dimensions: [
				'customEvent:googlesitekit_post_author',
				'eventName',
			],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ 'purchase' ],
				},
				'customEvent:googlesitekit_post_author': {
					filterType: 'emptyFilter',
					notExpression: true,
				},
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
			keepEmptyRows: false,
			reportID: 'analytics-4_goal-driver-reports_top-authors_ecommerce',
		};
		const totalReportOptions = {
			...dates,
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ 'purchase' ],
				},
			},
			metrics: [ { name: 'eventCount' } ],
			reportID:
				'analytics-4_goal-driver-reports_top-authors-total_ecommerce',
		};

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [
							{ value: 'AuthorName1' },
							{ value: 'purchase' },
						],
						metricValues: [ { value: '305' } ],
					},
					{
						dimensionValues: [
							{ value: 'AuthorName2' },
							{ value: 'purchase' },
						],
						metricValues: [ { value: '247' } ],
					},
					{
						dimensionValues: [
							{ value: 'AuthorName3' },
							{ value: 'purchase' },
						],
						metricValues: [ { value: '162' } ],
					},
				],
			},
			{ options: authorsReportOptions }
		);
		// The site-wide total (1,000) is larger than the sum of the ranked
		// rows above (714), so the percentages below only match if the
		// driver divides by this total rather than by the visible rows.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [ { metricValues: [ { value: '1000' } ] } ],
			},
			{ options: totalReportOptions }
		);

		const { getByText, waitForRegistry } = render(
			<TopAuthorsGoalDriver
				goalType="ecommerce"
				title="Top authors driving sales"
				primaryEvent="purchase"
			/>,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( 'AuthorName1' ) ).toBeInTheDocument();
		expect( getByText( '30.5%' ) ).toBeInTheDocument();
		expect( getByText( 'AuthorName2' ) ).toBeInTheDocument();
		expect( getByText( '24.7%' ) ).toBeInTheDocument();
		expect( getByText( 'AuthorName3' ) ).toBeInTheDocument();
		expect( getByText( '16.2%' ) ).toBeInTheDocument();
	} );
} );

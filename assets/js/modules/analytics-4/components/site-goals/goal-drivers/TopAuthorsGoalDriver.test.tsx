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
} );

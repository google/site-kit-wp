/**
 * Key Metrics FullScreenMetricSelectionApp component tests.
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
import FullScreenMetricSelectionApp from './FullScreenMetricSelectionApp';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import {
	CORE_USER,
	KM_ANALYTICS_PAGES_PER_VISIT,
	KM_ANALYTICS_POPULAR_AUTHORS,
	KM_ANALYTICS_TOP_CATEGORIES,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
	KM_ANALYTICS_VISIT_LENGTH,
	KM_ANALYTICS_VISITS_PER_VISITOR,
} from '../../googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '../../modules/analytics-4/datastore/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../util/errors';
import { KEY_METRICS_WIDGETS } from './key-metrics-widgets';
import { VIEW_CONTEXT_METRIC_SELECTION } from '../../googlesitekit/constants';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideKeyMetrics,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	render,
	waitFor,
} from '../../../../tests/js/test-utils';
import { mockLocation } from '../../../../tests/js/mock-browser-utils';
import { provideKeyMetricsWidgetRegistrations } from './test-utils';
import { withConnected } from '../../googlesitekit/modules/datastore/__fixtures__';

describe( 'FullScreenMetricSelectionApp', () => {
	mockLocation();

	let registry;

	const coreKeyMetricsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/key-metrics'
	);

	const coreUserInputSettingsExpectedResponse = {
		purpose: {
			values: [ 'purpose1' ],
			scope: 'site',
		},
		postFrequency: {
			values: [ 'daily' ],
			scope: 'user',
		},
		goals: {
			values: [ 'goal1', 'goal2' ],
			scope: 'user',
		},
	};

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserInfo( registry, { id: 1 } );
		provideModules( registry, withConnected( 'analytics-4' ) );
		provideKeyMetrics( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );
		registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( false );

		registry
			.dispatch( CORE_USER )
			.receiveGetUserInputSettings(
				coreUserInputSettingsExpectedResponse
			);

		registry
			.dispatch( CORE_USER )
			.finishResolution( 'getUserInputSettings', [] );

		provideKeyMetricsWidgetRegistrations(
			registry,
			Object.keys( KEY_METRICS_WIDGETS ).reduce(
				( acc, widget ) => ( {
					...acc,
					[ widget ]: {
						modules: [ 'analytics-4' ],
					},
				} ),
				{}
			)
		);

		registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_manage_options: true,
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID: 1234567,
			availableCustomDimensions: [],
		} );
	} );

	it( 'should render the component', async () => {
		const { getByText, waitForRegistry } = render(
			<FullScreenMetricSelectionApp />,
			{
				registry,
				viewContext: VIEW_CONTEXT_METRIC_SELECTION,
			}
		);

		await waitForRegistry();

		expect(
			getByText(
				'Select up to 8 metrics that are most important for your business goals'
			)
		).toBeInTheDocument();
	} );

	it( 'should navigate to the dashboard after saving', async () => {
		fetchMock.postOnce( coreKeyMetricsEndpointRegExp, {
			body: {
				widgetSlugs: [
					KM_ANALYTICS_PAGES_PER_VISIT,
					KM_ANALYTICS_VISIT_LENGTH,
					KM_ANALYTICS_VISITS_PER_VISITOR,
				],
				isWidgetHidden: false,
			},
			status: 200,
		} );

		provideKeyMetrics( registry, {
			widgetSlugs: [
				KM_ANALYTICS_PAGES_PER_VISIT,
				KM_ANALYTICS_VISIT_LENGTH,
				KM_ANALYTICS_VISITS_PER_VISITOR,
			],
		} );

		const { getByText, waitForRegistry } = render(
			<FullScreenMetricSelectionApp />,
			{
				registry,
				viewContext: VIEW_CONTEXT_METRIC_SELECTION,
			}
		);

		await waitForRegistry();

		fireEvent.click( getByText( 'Complete setup' ) );

		await waitFor( () => {
			expect( global.location.assign ).toHaveBeenCalled();
		} );

		expect( global.location.assign ).toHaveBeenCalledWith(
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard'
		);
	} );

	it( 'should set autoSubmit to true after saving if required custom dimensions are missing', async () => {
		fetchMock.postOnce( coreKeyMetricsEndpointRegExp, {
			body: {
				widgetSlugs: [
					KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
					KM_ANALYTICS_POPULAR_AUTHORS,
					KM_ANALYTICS_TOP_CATEGORIES,
				],
				isWidgetHidden: false,
			},
			status: 200,
		} );

		provideKeyMetrics( registry, {
			widgetSlugs: [
				KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
				KM_ANALYTICS_POPULAR_AUTHORS,
				KM_ANALYTICS_TOP_CATEGORIES,
			],
		} );

		const { getByText, waitForRegistry } = render(
			<FullScreenMetricSelectionApp />,
			{
				registry,
				viewContext: VIEW_CONTEXT_METRIC_SELECTION,
			}
		);

		await waitForRegistry();

		expect(
			registry
				.select( CORE_FORMS )
				.getValue( FORM_CUSTOM_DIMENSIONS_CREATE, 'autoSubmit' )
		).toBeUndefined();

		fireEvent.click( getByText( 'Complete setup' ) );

		await waitFor( () => {
			expect(
				registry
					.select( CORE_FORMS )
					.getValue( FORM_CUSTOM_DIMENSIONS_CREATE, 'autoSubmit' )
			).toBe( true );
		} );
	} );

	it( 'should set permission scope error after saving if required custom dimensions and scope are missing', async () => {
		provideUserAuthentication( registry, {
			unsatisfiedScopes: [ EDIT_SCOPE ],
		} );

		fetchMock.postOnce( coreKeyMetricsEndpointRegExp, {
			body: {
				widgetSlugs: [
					KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
					KM_ANALYTICS_POPULAR_AUTHORS,
					KM_ANALYTICS_TOP_CATEGORIES,
				],
				isWidgetHidden: false,
			},
			status: 200,
		} );

		provideKeyMetrics( registry, {
			widgetSlugs: [
				KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
				KM_ANALYTICS_POPULAR_AUTHORS,
				KM_ANALYTICS_TOP_CATEGORIES,
			],
		} );

		const { getByText, waitForRegistry } = render(
			<FullScreenMetricSelectionApp />,
			{
				registry,
				viewContext: VIEW_CONTEXT_METRIC_SELECTION,
			}
		);

		await waitForRegistry();

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByText( 'Complete setup' ) );
		} );

		const permissionScopeError = registry
			.select( CORE_USER )
			.getPermissionScopeError();

		expect( permissionScopeError ).toMatchObject( {
			code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
			data: {
				scopes: [ EDIT_SCOPE ],
				skipModal: true,
				redirectURL:
					'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&notification=custom_dimensions',
			},
		} );
	} );

	it( 'should not navigate to the dashboard after saving if required custom dimensions and scope are missing', async () => {
		provideUserAuthentication( registry, {
			unsatisfiedScopes: [ EDIT_SCOPE ],
		} );

		fetchMock.postOnce( coreKeyMetricsEndpointRegExp, {
			body: {
				widgetSlugs: [
					KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
					KM_ANALYTICS_POPULAR_AUTHORS,
					KM_ANALYTICS_TOP_CATEGORIES,
				],
				isWidgetHidden: false,
			},
			status: 200,
		} );

		provideKeyMetrics( registry, {
			widgetSlugs: [
				KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
				KM_ANALYTICS_POPULAR_AUTHORS,
				KM_ANALYTICS_TOP_CATEGORIES,
			],
		} );

		const { getByText, waitForRegistry } = render(
			<FullScreenMetricSelectionApp />,
			{
				registry,
				viewContext: VIEW_CONTEXT_METRIC_SELECTION,
			}
		);

		await waitForRegistry();

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByText( 'Complete setup' ) );
		} );

		expect( global.location.assign ).not.toHaveBeenCalled();
	} );
} );

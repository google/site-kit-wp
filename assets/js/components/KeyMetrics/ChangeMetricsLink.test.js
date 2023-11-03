/**
 * Key Metrics ChangeMetricsLink component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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

import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideKeyMetrics,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	render,
	waitFor,
} from '../../../../tests/js/test-utils';
import {
	mockSurveyEndpoints,
	surveyTimeoutEndpoint,
	surveyTriggerEndpoint,
} from '../../../../tests/js/mock-survey-endpoints';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from './constants';
import ChangeMetricsLink from './ChangeMetricsLink';

describe( 'ChangeMetricsLink', () => {
	let registry;

	const coreKeyMetricsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/key-metrics'
	);
	const coreUserInputSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/user-input-settings'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		freezeFetch( coreKeyMetricsEndpointRegExp );
		freezeFetch( coreUserInputSettingsEndpointRegExp );
	} );

	it( 'should not render if key metrics are undefined', () => {
		provideKeyMetrics( registry, { widgetSlugs: undefined } );

		const { queryByRole } = render( <ChangeMetricsLink />, { registry } );

		const button = queryByRole( 'button' );
		expect( button ).not.toBeInTheDocument();
	} );

	it( 'should not render if no key metrics are selected', () => {
		provideKeyMetrics( registry, { widgetSlugs: [] } );

		const { queryByRole } = render( <ChangeMetricsLink />, { registry } );

		const button = queryByRole( 'button' );
		expect( button ).not.toBeInTheDocument();
	} );

	it( 'should render a button to change metrics', () => {
		provideKeyMetrics( registry, { widgetSlugs: [ 'metricA' ] } );

		const { queryByRole } = render( <ChangeMetricsLink />, { registry } );

		const button = queryByRole( 'button' );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveTextContent( 'Change Metrics' );
	} );

	it( 'should set UI store key correctly when button is clicked', () => {
		provideKeyMetrics( registry, { widgetSlugs: [ 'metricA' ] } );

		registry
			.dispatch( CORE_UI )
			.setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, false );

		const { getByRole } = render( <ChangeMetricsLink />, { registry } );

		const button = getByRole( 'button', { name: /change metrics/i } );

		fireEvent.click( button );

		expect(
			registry
				.select( CORE_UI )
				.getValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY )
		).toBe( true );
	} );

	it( 'should trigger a survey when viewed', async () => {
		provideKeyMetrics( registry, { widgetSlugs: [ 'metricA' ] } );
		provideSiteInfo( registry, { keyMetricsSetupCompletedBy: 1 } );
		provideUserAuthentication( registry );
		mockSurveyEndpoints();

		render( <ChangeMetricsLink />, { registry } );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: { triggerID: 'view_kmw' },
				},
			} )
		);
	} );

	it( 'should trigger two surveys when the key metrics setup is completed by current user', async () => {
		provideKeyMetrics( registry, { widgetSlugs: [ 'metricA' ] } );
		provideSiteInfo( registry, { keyMetricsSetupCompletedBy: 1 } );
		provideUserInfo( registry, { id: 1 } );
		provideUserAuthentication( registry );
		fetchMock.post( surveyTriggerEndpoint, {
			status: 200,
			body: {},
		} );

		fetchMock.post( surveyTimeoutEndpoint, {
			status: 200,
			body: {},
		} );

		fetchMock.getOnce( surveyTimeoutEndpoint, {
			status: 200,
			body: {},
		} );

		render( <ChangeMetricsLink />, { registry } );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: { triggerID: 'view_kmw' },
				},
			} )
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: { triggerID: 'view_kmw_setup_completed' },
				},
			} )
		);
	} );
} );

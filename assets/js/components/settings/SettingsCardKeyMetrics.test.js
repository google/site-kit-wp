/**
 * SettingsCardKeyMetrics component tests.
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
	mockSurveyEndpoints,
	surveyTriggerEndpoint,
} from '../../../../tests/js/mock-survey-endpoints';
import { render, waitFor } from '../../../../tests/js/test-utils';
import {
	createTestRegistry,
	muteFetch,
	provideKeyMetrics,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import SettingsCardKeyMetrics from './SettingsCardKeyMetrics';

describe( 'SettingsCardKeyMetrics', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideSiteInfo( registry );
		provideModules( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		mockSurveyEndpoints();

		registry.dispatch( MODULES_ANALYTICS_4 ).setDetectedEvents( [] );

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/core/user/data/user-input-settings'
			)
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/user/data/key-metrics' )
		);
	} );

	it( 'should trigger a survey when the Key Metrics Setup CTA is in view', async () => {
		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		render( <SettingsCardKeyMetrics />, {
			registry,
		} );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched(
				surveyTriggerEndpoint,
				expect.objectContaining( {
					body: {
						data: { triggerID: 'view_kmw_setup_cta' },
					},
				} )
			)
		);
	} );

	it( 'should show ConversionReportingSettingsSubtleNotification when Key metrics are not setup', async () => {
		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		const { container, waitForRegistry } = render(
			<SettingsCardKeyMetrics />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-notice--new' )
		).toBeInTheDocument();
	} );

	it( 'should show ConversionReportingSettingsSubtleNotification when Key metrics are setup manually', async () => {
		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		provideKeyMetrics( registry );

		const { container, waitForRegistry } = render(
			<SettingsCardKeyMetrics />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-notice--new' )
		).toBeInTheDocument();

		// Default content should be replaced with ConversionReportingSettingsSubtleNotification,
		// so it should not be shown at the same time as ACR notification.
		expect(
			container.querySelector( '.googlesitekit-user-input__notification' )
		).not.toBeInTheDocument();
	} );

	it( 'should not show ConversionReportingSettingsSubtleNotification when Key metrics are setup using tailored metrics', async () => {
		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( true );

		const { container, waitForRegistry } = render(
			<SettingsCardKeyMetrics />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-notice--new' )
		).not.toBeInTheDocument();
	} );
} );

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
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import SettingsCardKeyMetrics from './SettingsCardKeyMetrics';

describe( 'SettingsCardKeyMetrics', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should trigger a survey when the Key Metrics Setup CTA is in view', async () => {
		mockSurveyEndpoints();
		provideUserAuthentication( registry );
		provideSiteInfo( registry );

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/core/user/data/user-input-settings'
			)
		);
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/user/data/key-metrics' )
		);

		await registry
			.dispatch( CORE_USER )
			.receiveIsUserInputCompleted( false );

		render( <SettingsCardKeyMetrics />, {
			registry,
		} );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: { triggerID: 'view_kmw_setup_cta' },
				},
			} )
		);
	} );
} );

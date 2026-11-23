/**
 * Feature Discovery Hub interaction survey trigger hook tests.
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
 * Internal dependencies
 */
import { FDH_OPENED_WITH_INTERACTION_SURVEY_TRIGGER_ID } from '@/js/components/feature-discovery/constants';
import { Registry } from '@/js/googlesitekit-data';
import {
	CORE_USER,
	SURVEY_TRIGGER_MAX_TTL,
} from '@/js/googlesitekit/datastore/user/constants';
import {
	surveyTriggerEndpoint,
	triggeredIDs,
} from '@tests/js/mock-survey-endpoints';
import {
	actHook,
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
	renderHook,
	waitFor,
} from '@tests/js/test-utils';
import useFeatureDiscoveryInteractionSurveyTrigger from './useFeatureDiscoveryInteractionSurveyTrigger';

describe( 'useFeatureDiscoveryInteractionSurveyTrigger', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideSiteInfo( registry );
		provideUserAuthentication( registry );

		fetchMock.post( surveyTriggerEndpoint, { body: {} } );
	} );

	it( 'should send the hub interaction survey trigger with the maximum TTL', async () => {
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

		const { result, waitForRegistry } = renderHook(
			() => useFeatureDiscoveryInteractionSurveyTrigger(),
			{ registry }
		);

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );

		actHook( () => {
			result.current();
		} );

		await waitForRegistry();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( surveyTriggerEndpoint, {
				body: {
					data: {
						triggerID:
							FDH_OPENED_WITH_INTERACTION_SURVEY_TRIGGER_ID,
						ttl: SURVEY_TRIGGER_MAX_TTL,
					},
				},
			} )
		);
	} );

	it( 'should send the survey trigger only once however often it is called', async () => {
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

		const { result, waitForRegistry } = renderHook(
			() => useFeatureDiscoveryInteractionSurveyTrigger(),
			{ registry }
		);

		actHook( () => {
			result.current();
		} );

		await waitForRegistry();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes( 1, surveyTriggerEndpoint )
		);

		actHook( () => {
			result.current();
			result.current();
		} );

		await waitForRegistry();

		expect( triggeredIDs() ).toEqual( [
			FDH_OPENED_WITH_INTERACTION_SURVEY_TRIGGER_ID,
		] );
	} );

	it( 'should not send the survey trigger when it has already been sent', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetSurveyTimeouts( [
				FDH_OPENED_WITH_INTERACTION_SURVEY_TRIGGER_ID,
			] );

		const { result, waitForRegistry } = renderHook(
			() => useFeatureDiscoveryInteractionSurveyTrigger(),
			{ registry }
		);

		actHook( () => {
			result.current();
		} );

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( surveyTriggerEndpoint );
	} );
} );

/**
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

export const surveyTriggerEndpoint = new RegExp(
	'^/google-site-kit/v1/core/user/data/survey-trigger'
);

export const surveyEventEndpoint = new RegExp(
	'^/google-site-kit/v1/core/user/data/survey-event'
);

export const surveyTimeoutsEndpoint = new RegExp(
	'^/google-site-kit/v1/core/user/data/survey-timeouts'
);

/**
 * Mocks the survey endpoints.
 *
 * @since 1.111.1
 */
export const mockSurveyEndpoints = () => {
	fetchMock.postOnce( surveyTriggerEndpoint, {
		status: 200,
		body: {},
	} );

	fetchMock.getOnce( surveyTimeoutsEndpoint, {
		status: 200,
		body: [],
	} );
};

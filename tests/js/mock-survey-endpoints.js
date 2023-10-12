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

/**
 * Mocks the survey endpoints.
 *
 * @since n.e.x.t
 */
export const mockSurveyEndpoints = () => {
	const surveyTriggerEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/survey-trigger'
	);
	const surveyTimeoutEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/survey-timeout'
	);

	fetchMock.postOnce( surveyTriggerEndpoint, {
		status: 200,
		body: {},
	} );

	fetchMock.getOnce( surveyTimeoutEndpoint, {
		status: 200,
		body: {},
	} );

	fetchMock.postOnce( surveyTimeoutEndpoint, {
		status: 200,
		body: {},
	} );
};

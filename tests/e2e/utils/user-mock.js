/**
 * Mocks user in E2E tests.
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

/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

/**
 * Mocks different user during E2E tests.
 *
 * @since n.e.x.t
 *
 * @param {Array<string>} userdata User registration details.
 * @return {Promise} Promise from `page.evaluate()` call.
 */
export async function createUser( userdata ) {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/user-management/create-user',
		method: 'post',
		data: {
			userdata,
		},
	} );
}

/* eslint-disable jsdoc/check-line-alignment */
/**
 * Sets a mock user that will be authentificated on page reload.
 *
 * @since n.e.x.t
 *
 * @param {number} userID ID that should be set for the mock user.
 * @param {string} role Role that should be assigned to the mock user.
 * @return {Promise} Promise from `page.evaluate()` call.
 */
export async function setCurrentUser( userID, role = 'administrator' ) {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/user-mock/set-mock-user',
		method: 'post',
		data: {
			user_id: userID,
			role,
		},
	} );
}

/**
 * Reverts current user back to admin during E2E tests.
 * This happens automatically on seconda page reload or navigating away,
 * but can be forced if needed as well.
 *
 * @since n.e.x.t
 *
 * @return {Promise} Promise from `page.evaluate()` call.
 */
export async function resetCurrentUser() {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/user-mock/reset-current-user',
		method: 'post',
		data: {},
	} );
}

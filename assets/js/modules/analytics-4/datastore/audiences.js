/**
 * `modules/analytics-4` data store: audiences.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import API from 'googlesitekit-api';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchGetAudiencesStore = createFetchStore( {
	baseName: 'getAudiences',
	controlCallback() {
		return API.get(
			'modules',
			'analytics-4',
			'audiences',
			{},
			{
				useCache: false,
			}
		);
	},
	reducerCallback( state, audiences ) {
		return { ...state, audiences };
	},
} );
fetchGetAudiencesStore();

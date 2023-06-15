/**
 * `modules/adsense` data store: ad-blocking-recovery.
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
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchSyncAdBlockingRecoveryTagsStore = createFetchStore( {
	baseName: 'syncAdBlockingRecoveryTags',
	controlCallback: () => {
		return API.set(
			'modules',
			'adsense',
			'sync-ad-blocking-recovery-tags'
		);
	},
} );

const baseActions = {
	/**
	 * Triggers an API request to sync Ad Blocking Recovery and Error Protection tags on the server.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	syncAdBlockingRecoveryTags() {
		return fetchSyncAdBlockingRecoveryTagsStore.actions.fetchSyncAdBlockingRecoveryTags();
	},
};

const store = Data.combineStores( fetchSyncAdBlockingRecoveryTagsStore, {
	actions: baseActions,
} );

export default store;

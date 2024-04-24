/**
 * `modules/adsense` base data store
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import Modules from 'googlesitekit-modules';
import { MODULES_ADSENSE } from './constants';
import { validateCanSubmitChanges } from './settings';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

const baseModuleStore = Modules.createModuleStore( 'adsense', {
	ownedSettingsSlugs: [ 'accountID', 'clientID' ],
	storeName: MODULES_ADSENSE,
	settingSlugs: [
		'accountID',
		'clientID',
		'useSnippet',
		'accountStatus',
		'siteStatus',
		'accountSetupComplete',
		'siteSetupComplete',
		'ownerID',
		'webStoriesAdUnit',
		'autoAdsDisabled',
		'setupCompletedTimestamp',
		'useAdBlockingRecoverySnippet',
		'useAdBlockingRecoveryErrorSnippet',
		'adBlockingRecoverySetupStatus',
	],
	validateCanSubmitChanges,
	validateIsSetupBlocked: ( select ) => {
		if ( select( CORE_USER ).isAdBlockerActive() ) {
			throw new Error( 'Ad blocker detected' );
		}
	},
} );

export default baseModuleStore;

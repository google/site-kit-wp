/**
 * `modules/ads` base data store.
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
import Modules from 'googlesitekit-modules';
import { MODULES_ADS } from './constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import {
	submitChanges,
	rollbackChanges,
	validateCanSubmitChanges,
	validateHaveSettingsChanged,
} from './settings';

const baseModuleStore = Modules.createModuleStore( MODULE_SLUG_ADS, {
	ownedSettingsSlugs: [
		'conversionID',
		'paxConversionID',
		'extCustomerID',
		'customerID',
		'userID',
	],
	storeName: MODULES_ADS,
	settingSlugs: [
		'conversionID',
		'ownerID',
		'paxConversionID',
		'customerID',
		'extCustomerID',
		'formattedExtCustomerID',
		'userID',
		'accountOverviewURL',
	],
	requiresSetup: true,
	submitChanges,
	rollbackChanges,
	validateCanSubmitChanges,
	validateHaveSettingsChanged,
} );

export default baseModuleStore;

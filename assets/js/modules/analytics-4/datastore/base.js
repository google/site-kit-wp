/**
 * `modules/analytics-4` base data store
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
import { MODULES_ANALYTICS_4 } from './constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../constants';
import {
	submitChanges,
	validateCanSubmitChanges,
	rollbackChanges,
	validateHaveSettingsChanged,
} from './settings';
import { convertDateStringToUNIXTimestamp } from '../../../util';

const baseModuleStore = Modules.createModuleStore( MODULE_SLUG_ANALYTICS_4, {
	ownedSettingsSlugs: [
		'accountID',
		'propertyID',
		'webDataStreamID',
		'measurementID',
		'googleTagID',
		'googleTagAccountID',
		'googleTagContainerID',
	],
	storeName: MODULES_ANALYTICS_4,
	settingSlugs: [
		'accountID',
		'adsConversionID',
		'adSenseLinked',
		'adSenseLinkedLastSyncedAt',
		'propertyID',
		'webDataStreamID',
		'measurementID',
		'useSnippet',
		'ownerID',
		'googleTagID',
		'googleTagAccountID',
		'googleTagContainerID',
		'googleTagContainerDestinationIDs',
		'googleTagLastSyncedAtMs',
		'availableCustomDimensions',
		'propertyCreateTime',
		'trackingDisabled',
		'adsConversionIDMigratedAtMs',
		'adsLinked',
		'adsLinkedLastSyncedAt',
		'detectedEvents',
		'newConversionEventsLastUpdateAt',
		'lostConversionEventsLastUpdateAt',
	],
	submitChanges,
	rollbackChanges,
	validateCanSubmitChanges,
	validateHaveSettingsChanged,
} );

const originalSetPropertyCreateTime =
	baseModuleStore.actions.setPropertyCreateTime;

baseModuleStore.actions.setPropertyCreateTime = ( value ) => {
	return originalSetPropertyCreateTime(
		convertDateStringToUNIXTimestamp( value )
	);
};

export default baseModuleStore;

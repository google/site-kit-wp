/**
 * `core/user` data store
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
import { combineStores, commonStore } from 'googlesitekit-data';
import { createErrorStore } from '../../data/create-error-store';
import adblocker from './adblocker';
import audienceSettings from './audience-settings';
import authentication from './authentication';
import { CORE_USER } from './constants';
import dateRange from './date-range';
import disconnect from './disconnect';
import dismissedItems from './dismissed-items';
import expirableItems from './expirable-items';
import featureTours from './feature-tours';
import keyMetrics from './key-metrics';
import notifications from './notifications';
import nonces from './nonces';
import permissions from './permissions';
import prompts from './prompts';
import surveys from './surveys';
import tracking from './tracking';
import userInfo from './user-info';
import userInputSettings from './user-input-settings';
import conversionReportingSettings from './conversion-reporting-settings';

const store = combineStores(
	commonStore,
	createErrorStore( CORE_USER ),
	adblocker,
	audienceSettings,
	authentication,
	dateRange,
	disconnect,
	dismissedItems,
	expirableItems,
	featureTours,
	keyMetrics,
	notifications,
	permissions,
	prompts,
	nonces,
	surveys,
	tracking,
	userInfo,
	userInputSettings,
	conversionReportingSettings
);

export const {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
} = store;

export const registerStore = ( registry ) => {
	registry.registerStore( CORE_USER, store );

	// If a reference date was set by the server, set it in the store.
	if ( global._googlesitekitBaseData?.referenceDate ) {
		registry
			.dispatch( CORE_USER )
			.setReferenceDate( global._googlesitekitBaseData.referenceDate );
	}
};

export default store;

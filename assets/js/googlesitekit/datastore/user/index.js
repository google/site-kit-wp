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
import Data from 'googlesitekit-data';
import { createErrorStore } from '../../data/create-error-store';
import authentication from './authentication';
import dateRange from './date-range';
import disconnect from './disconnect';
import dismissedItems from './dismissed-items';
import featureTours from './feature-tours';
import notifications from './notifications';
import permissions from './permissions';
import surveys from './surveys';
import tracking from './tracking';
import userInfo from './user-info';
import userInputSettings from './user-input-settings';
import { STORE_NAME } from './constants';

const store = Data.combineStores(
	Data.commonStore,
	createErrorStore(),
	authentication,
	dateRange,
	disconnect,
	dismissedItems,
	featureTours,
	notifications,
	permissions,
	surveys,
	tracking,
	userInfo,
	userInputSettings,
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
	registry.registerStore( STORE_NAME, store );
};

export default store;

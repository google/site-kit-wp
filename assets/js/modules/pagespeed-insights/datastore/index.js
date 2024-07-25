/**
 * `modules/pagespeed-insights` data store
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
import { combineStores } from 'googlesitekit-data';
import report from './report';
import service from './service';
import baseModuleStore from './base';
import { MODULES_PAGESPEED_INSIGHTS } from './constants';

const store = combineStores( baseModuleStore, report, service );

export const registerStore = ( registry ) => {
	registry.registerStore( MODULES_PAGESPEED_INSIGHTS, store );
};

export default store;

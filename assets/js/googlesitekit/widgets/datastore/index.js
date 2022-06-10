/**
 * `core/widgets` data store
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
import areas from './areas';
import widgets from './widgets';
import contexts from './contexts';
import { createErrorStore } from '../../data/create-error-store';
import { CORE_WIDGETS } from './constants';

const store = Data.combineStores(
	Data.commonStore,
	areas,
	widgets,
	contexts,
	createErrorStore( CORE_WIDGETS )
);

export const registerStore = ( registry ) => {
	registry.registerStore( CORE_WIDGETS, store );
};

export default store;

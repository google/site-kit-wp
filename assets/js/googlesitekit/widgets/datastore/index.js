/**
 * core/widgets data store
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

export const INITIAL_STATE = Data.collectState(
	areas.INITIAL_STATE,
	widgets.INITIAL_STATE,
);

import { STORE_NAME } from './constants';
export { STORE_NAME };

export const actions = Data.addInitializeAction(
	Data.collectActions(
		Data.commonActions,
		areas.actions,
		widgets.actions,
	)
);

export const controls = Data.collectControls(
	Data.commonControls,
	areas.controls,
	widgets.controls,
);

export const reducer = Data.addInitializeReducer(
	INITIAL_STATE,
	Data.collectReducers(
		areas.reducer,
		widgets.reducer,
	)
);

export const resolvers = Data.collectResolvers(
	areas.resolvers,
	widgets.resolvers,
);

export const selectors = Data.collectSelectors(
	areas.selectors,
	widgets.selectors,
);

const store = {
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

// Register this store on the global registry.
Data.registerStore( STORE_NAME, store );

export default store;

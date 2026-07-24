/**
 * `core/user` data store: email reporting next report.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { get } from 'googlesitekit-api';
import {
	combineStores,
	commonActions,
	createReducer,
} from 'googlesitekit-data';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { CORE_USER } from './constants';

const baseInitialState = {
	emailReportingNextReport: {
		timestamp: undefined,
	},
};

const fetchGetEmailReportingNextReportStore = createFetchStore( {
	baseName: 'getEmailReportingNextReport',
	controlCallback: () =>
		get( 'core', 'user', 'email-reporting-next-report', undefined, {
			// Always fetch fresh data instead of relying on a cached value,
			// since the next report timestamp depends on the current time
			// and can go stale quickly.
			useCache: false,
		} ),
	reducerCallback: createReducer( ( state, { timestamp } ) => {
		state.emailReportingNextReport.timestamp = timestamp;
	} ),
} );

// Actions
const RESET_EMAIL_REPORTING_NEXT_REPORT = 'RESET_EMAIL_REPORTING_NEXT_REPORT';

const baseActions = {
	/**
	 * Clears the cached next report timestamp and re-resolves it from the server.
	 *
	 * Should be called whenever the saved email reporting frequency changes
	 * (e.g. after saving settings), since the previously fetched timestamp
	 * would otherwise remain stale for the lifetime of the page.
	 *
	 * @since n.e.x.t
	 */
	*invalidateEmailReportingNextReport() {
		const registry = yield commonActions.getRegistry();

		yield {
			type: RESET_EMAIL_REPORTING_NEXT_REPORT,
			payload: {},
		};

		registry
			.dispatch( CORE_USER )
			.invalidateResolutionForStoreSelector(
				'getEmailReportingNextReportTimestamp'
			);
	},
};

const baseReducer = createReducer( ( state, action ) => {
	if ( action.type === RESET_EMAIL_REPORTING_NEXT_REPORT ) {
		state.emailReportingNextReport.timestamp = undefined;
	}
} );

const baseResolvers = {
	*getEmailReportingNextReportTimestamp() {
		const registry = yield commonActions.getRegistry();

		const timestamp = registry
			.select( CORE_USER )
			.getEmailReportingNextReportTimestamp();

		if ( timestamp === undefined ) {
			yield fetchGetEmailReportingNextReportStore.actions.fetchGetEmailReportingNextReport();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the next scheduled email report timestamp for the user's saved frequency.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(number|undefined)} Unix timestamp (in seconds) of the next scheduled report; `undefined` if not loaded.
	 */
	getEmailReportingNextReportTimestamp( state ) {
		return state.emailReportingNextReport.timestamp;
	},
};

const store = combineStores( fetchGetEmailReportingNextReportStore, {
	initialState: baseInitialState,
	actions: baseActions,
	reducer: baseReducer,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;

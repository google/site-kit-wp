/**
 * modules/adsense data store: report.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './index';
import { stringifyObject } from '../../../util';

// Actions
const FETCH_REPORT = 'FETCH_REPORT';
const START_FETCH_REPORT = 'START_FETCH_REPORT';
const FINISH_FETCH_REPORT = 'FINISH_FETCH_REPORT';
const CATCH_FETCH_REPORT = 'CATCH_FETCH_REPORT';

const RECEIVE_REPORT = 'RECEIVE_REPORT';

export const INITIAL_STATE = {
	isFetchingReport: {},
	reports: {},
};

export const actions = {
	*fetchReport( options ) {
		invariant( 'object' === typeof options, 'options must be an object.' );

		let response, error;

		yield {
			payload: { options },
			type: START_FETCH_REPORT,
		};

		try {
			response = yield {
				payload: { options },
				type: FETCH_REPORT,
			};

			yield actions.receiveReport( response, { options } );

			yield {
				payload: { options },
				type: FINISH_FETCH_REPORT,
			};
		} catch ( err ) {
			error = err;

			yield {
				payload: { error, options },
				type: CATCH_FETCH_REPORT,
			};
		}

		return { response, error };
	},

	receiveReport( report, { options } ) {
		invariant( 'object' === typeof report, 'report must be an array.' );
		invariant( 'object' === typeof options, 'options must be an object.' );

		return {
			payload: { options, report },
			type: RECEIVE_REPORT,
		};
	},
};

export const controls = {
	[ FETCH_REPORT ]: ( { payload: { options } } ) => {
		return API.get( 'modules', 'adsense', 'earnings', options );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case FETCH_REPORT: {
			const { options } = payload;

			return {
				...state,
				isFetchingReport: {
					...state.isFetchingReport,
					[ stringifyObject( options ) ]: true,
				},
			};
		}

		case RECEIVE_REPORT: {
			const { options, report } = payload;

			return {
				...state,
				reports: {
					...state.reports,
					[ stringifyObject( options ) ]: report,
				},
			};
		}

		case FINISH_FETCH_REPORT: {
			const { options } = payload;

			return {
				...state,
				isFetchingReport: {
					...state.isFetchingReport,
					[ stringifyObject( options ) ]: false,
				},
			};
		}

		case CATCH_FETCH_REPORT: {
			const { options, error } = payload;

			return {
				...state,
				error,
				isFetchingReport: {
					...state.isFetchingReport,
					[ stringifyObject( options ) ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getReport( options = {} ) {
		const registry = yield Data.commonActions.getRegistry();
		const existingReport = registry.select( STORE_NAME ).getReport( options );

		// If there are already alerts loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingReport ) {
			return;
		}

		yield actions.fetchReport( options );
	},
};

export const selectors = {
	/**
	 * Gets a Google AdSense report for the given options.
	 *
	 * The report generated will include the following metrics:
	 * * 'EARNINGS'
	 * * 'PAGE_VIEWS_RPM'
	 * * 'IMPRESSIONS'
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}         state              Data store's state.
	 * @param {?Object}        options            Optional. Options for generating the report.
	 * @param {string}         options.dateRange  Date range slug. Default 'last-28-days'.
	 * @param {Array.<string>} options.dimensions Dimensions to use.
	 * @param {number}         options.limit      Maximum number of rows to include.
	 * @return {?Array.<Object>} An AdSense report; `undefined` if not loaded.
	 */
	getReport( state, options = {} ) {
		const { reports } = state;

		return reports[ stringifyObject( options ) ];
	},
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

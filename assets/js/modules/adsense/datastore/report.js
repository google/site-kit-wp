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
const RECEIVE_REPORT = 'RECEIVE_REPORT';
const RECEIVE_REPORT_SUCCEEDED = 'RECEIVE_REPORT_SUCCEEDED';
const RECEIVE_REPORT_FAILED = 'RECEIVE_REPORT_FAILED';

export const INITIAL_STATE = {
	isFetchingReport: {},
	reports: {},
};

export const actions = {
	fetchReport( options ) {
		invariant( 'object' === typeof options, 'options must be an object.' );

		return {
			payload: { options },
			type: FETCH_REPORT,
		};
	},

	receiveReport( { options, report } ) {
		invariant( 'object' === typeof options, 'options must be an object.' );
		invariant( 'object' === typeof report, 'report must be an array.' );

		return {
			payload: { options, report },
			type: RECEIVE_REPORT,
		};
	},

	receiveReportSucceeded( options ) {
		invariant( 'object' === typeof options, 'options must be an object.' );

		return {
			payload: { options },
			type: RECEIVE_REPORT_SUCCEEDED,
		};
	},

	receiveReportFailed( { options, error } ) {
		invariant( 'object' === typeof options, 'options must be an object.' );
		invariant( error, 'error is required.' );

		return {
			payload: { options, error },
			type: RECEIVE_REPORT_FAILED,
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

		case RECEIVE_REPORT_SUCCEEDED: {
			const { options } = payload;

			return {
				...state,
				isFetchingReport: {
					...state.isFetchingReport,
					[ stringifyObject( options ) ]: false,
				},
			};
		}

		case RECEIVE_REPORT_FAILED: {
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

		try {
			const report = yield actions.fetchReport( options );

			yield actions.receiveReport( { options, report } );

			return yield actions.receiveReportSucceeded( options );
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveReportFailed( { options, error } );
		}
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

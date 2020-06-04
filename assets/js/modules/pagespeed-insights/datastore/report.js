/**
 * modules/pagespeed-insights data store: report.
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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';

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
	/**
	 * Fetches a PageSpeed Insights report.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string}	url 		URL used for generating the report.
	 * @param {string}	strategy	Strategy used for generating the report.
	 * @return {Object} Redux-style action.
	 */
	*fetchReport( url, strategy ) {
		let response, error;

		yield {
			payload: { strategy, url },
			type: START_FETCH_REPORT,
		};

		try {
			const report = yield {
				payload: { strategy, url },
				type: FETCH_REPORT,
			};

			yield actions.receiveReport( report, { strategy, url } );

			yield {
				payload: { strategy, url },
				type: FINISH_FETCH_REPORT,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: {
					error,
					strategy,
					url,
				},
				type: CATCH_FETCH_REPORT,
			};
		}

		return { response, error };
	},

	/**
	 * Adds report to the store.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} 	report				Report to add.
	 * @param {Object}	[args]				Options used for generating the report.
	 * @param {string} 	[args.strategy]		Strategy used for generating the report.
	 * @param {string} 	[args.url]			URL used for generating the report.
	 * @return {Object} Redux-style action.
	 */
	receiveReport( report, { strategy, url } ) {
		invariant( isPlainObject( report ), 'report must be an object.' );
		invariant( typeof strategy === 'string', 'report must be a string.' );
		invariant( typeof url === 'string', 'report must be a string.' );

		return {
			payload: { report, strategy, url },
			type: RECEIVE_REPORT,
		};
	},

};

export const controls = {
	[ FETCH_REPORT ]: ( { payload: { strategy, url } } ) => {
		return API.get( 'modules', 'pagespeed-insights', 'pagespeed', { strategy, url } );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_FETCH_REPORT: {
			const { strategy, url } = payload;

			return {
				...state,
				isFetchingReport: {
					...state.isFetchingReport,
					[ `${ strategy }::${ url }` ]: true,
				},
			};
		}

		case FINISH_FETCH_REPORT: {
			const { strategy, url } = payload;

			return {
				...state,
				isFetchingReport: {
					...state.isFetchingReport,
					[ `${ strategy }::${ url }` ]: false,
				},
			};
		}

		case RECEIVE_REPORT: {
			const { report, strategy, url } = payload;

			return {
				...state,
				reports: {
					...state.reports,
					[ `${ strategy }::${ url }` ]: { ...report },
				},
			};
		}

		case CATCH_FETCH_REPORT: {
			const { error, strategy, url } = payload;

			return {
				...state,
				error,
				isFetchingReport: {
					...state.isFetchingReport,
					[ `${ strategy }::${ url }` ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getReport( url, strategy ) {
		const registry = yield Data.commonActions.getRegistry();
		const existingReport = registry.select( STORE_NAME ).getReport( url, strategy );

		// If there is already a report loaded in state, consider it fulfilled and don't make an API request.
		if ( existingReport ) {
			return;
		}

		yield actions.fetchReport( url, strategy );
	},
};

export const selectors = {
	/**
	 * Gets a PageSpeed Insights report for the given strategy and URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}         		state		Data store's state.
	 * @param {string} 				url			URL used for generating the report.
	 * @param {string} 				strategy	Strategy used for generating the report.
	 * @return {(Object|undefined)} A PageSpeed Insights report; `undefined` if not loaded.
	 */
	getReport( state, url, strategy ) {
		const { reports } = state;

		return reports[ `${ strategy }::${ url }` ];
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

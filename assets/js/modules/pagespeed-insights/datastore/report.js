/**
 * `modules/pagespeed-insights` data store: report.
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
 * WordPress dependencies
 */
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
const { combineStores, createRegistrySelector } = Data;

const fetchGetReportStore = createFetchStore( {
	baseName: 'getReport',
	controlCallback: ( { strategy, url } ) => {
		return API.get( 'modules', 'pagespeed-insights', 'pagespeed', { strategy, url } );
	},
	reducerCallback: ( state, report, { strategy, url } ) => {
		return {
			...state,
			reports: {
				...state.reports,
				[ `${ strategy }::${ url }` ]: { ...report },
			},
		};
	},
	argsToParams: ( url, strategy ) => {
		return {
			strategy,
			url,
		};
	},
	validateParams: ( { strategy, url } = {} ) => {
		invariant( isURL( url ), 'a valid url is required to fetch a report.' );
		invariant( typeof strategy === 'string', 'a valid strategy is required to fetch a report.' );
	},
} );

const baseInitialState = {
	reports: {},
};

const baseResolvers = {
	*getReport( url, strategy ) {
		if ( ! url || ! strategy ) {
			return;
		}

		yield fetchGetReportStore.actions.fetchGetReport( url, strategy );
	},
};

const baseSelectors = {
	/**
	 * Gets a PageSpeed Insights report for the given strategy and URL.
	 *
	 * @since 1.10.0
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} url      URL used for generating the report.
	 * @param {string} strategy Strategy used for generating the report.
	 * @return {(Object|undefined)} A PageSpeed Insights report; `undefined` if not loaded.
	 */
	getReport( state, url, strategy ) {
		const { reports } = state;

		return reports[ `${ strategy }::${ url }` ];
	},

	/**
	 * Gets report audits for the given strategy and URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Report audits.
	 */
	getAudits: createRegistrySelector( ( select ) => ( state, url, strategy, withStackPacks = false ) => {
		const report = select( STORE_NAME ).getReport( url, strategy );
		if ( report === undefined ) {
			return undefined;
		}

		const { lighthouseResult } = report || {};
		const { audits } = lighthouseResult || {};
		if ( ! audits ) {
			return {};
		}

		if ( withStackPacks ) {
			const filteredAudits = {};

			Object.keys( audits ).forEach( ( auditID ) => {
				const stackPacks = select( STORE_NAME ).getStackPackDescriptions( url, strategy, auditID );
				if ( Array.isArray( stackPacks ) && stackPacks.length > 0 ) {
					filteredAudits[ auditID ] = audits[ auditID ];
				}
			} );

			return filteredAudits;
		}

		return audits;
	} ),

	/**
	 * Gets stack pack descriptions for a sepcific report audit.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<Object>|undefined)} Stack pack descriptions for an audit.
	 */
	getStackPackDescriptions: createRegistrySelector( ( select ) => ( state, url, strategy, auditID ) => {
		const report = select( STORE_NAME ).getReport( url, strategy );
		if ( report === undefined ) {
			return undefined;
		}

		const descriptions = [];

		const { lighthouseResult } = report || {};
		const { stackPacks } = lighthouseResult || [];
		if ( ! Array.isArray( stackPacks ) ) {
			return descriptions;
		}

		stackPacks
			.filter( ( stackPack ) => !! stackPack.descriptions[ auditID ] )
			.forEach( ( stackPack ) => {
				descriptions.push( {
					id: stackPack.id,
					icon: stackPack.iconDataURL,
					title: stackPack.title,
					description: stackPack.descriptions[ auditID ],
				} );
			} );

		return descriptions;
	} ),
};

const store = combineStores(
	fetchGetReportStore,
	{
		initialState: baseInitialState,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;

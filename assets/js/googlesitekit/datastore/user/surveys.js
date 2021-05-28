/**
 * `core/user` data store: Surveys.
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
 * External dependencies
 */
import isPlainObject from 'lodash/isPlainObject';
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';
import { createValidatedAction } from '../../data/utils';
import { createCacheKey } from '../../api';
import { getItem, setItem } from '../../api/cache';

const fetchTriggerSurveyStore = createFetchStore( {
	baseName: 'triggerSurvey',
	controlCallback: ( { triggerID } ) => {
		return API.set( 'core', 'user', 'survey-trigger', { triggerID } );
	},
	argsToParams: ( triggerID ) => {
		return { triggerID };
	},
	reducerCallback: ( state, { survey_payload, session } ) => { // eslint-disable-line camelcase
		return {
			...state,
			currentSurvey: survey_payload,
			currentSurveySession: session,
		};
	},
	validateParams: ( { triggerID } = {} ) => {
		invariant( 'string' === typeof triggerID && triggerID.length, 'triggerID is required and must be a string' );
	},

} );

const fetchSendSurveyEventStore = createFetchStore( {
	baseName: 'sendSurveyEvent',
	controlCallback: ( { event, session } ) => API.set( 'core', 'user', 'survey-event', { event, session } ),
	argsToParams: ( event, session ) => {
		return { event, session };
	},
} );

const baseInitialState = {
	currentSurvey: null,
	currentSurveySession: null,
};

const baseActions = {
	triggerSurvey: createValidatedAction(
		( triggerID, options = { ttl: 0 } ) => {
			invariant( 'string' === typeof triggerID && triggerID.length, 'triggerID is required and must be a string' );
			invariant( isPlainObject( options ), 'options must be an object' );
			invariant( 'number' === typeof options.ttl, 'options.ttl must be a number' );
		},
		function* ( triggerID, { ttl = 0 } = {} ) {
			const { select } = yield Data.commonActions.getRegistry();
			if ( null !== select( STORE_NAME ).getCurrentSurvey() ) {
				return;
			}
			const cacheKey = createCacheKey( 'core', 'user', 'survey-event', { triggerID } );
			const { cacheHit, value } = yield Data.commonActions.await( getItem( cacheKey ) );
			if ( false === cacheHit && options.ttl ) {
				const { error, response } = yield fetchTriggerSurveyStore.actions.fetchTriggerSurvey( triggerID );
				if ( ! error && options.ttl > 0 ) {
					yield Data.commonActions.await( setItem( cacheKey, {} ) );
					return { response, error };
				}
			}
			return {
				response: value,
				error: false,
			};
		}
	),
	sendSurveyEvent: createValidatedAction(
		( eventID, eventData = {} ) => {
			invariant( 'string' === typeof eventID && eventID.length, 'eventID is required and must be a string' );
			invariant( isPlainObject( eventData ), 'eventData must be an object' );
		},
		function* ( eventID, eventData = {} ) {
			const event = { [ eventID ]: eventData };
			const { select } = yield Data.commonActions.getRegistry();
			const session = select( STORE_NAME ).getCurrentSurveySession();
			if ( session ) {
				const { response, error } = yield fetchSendSurveyEventStore.actions.fetchSendSurveyEvent( event, session );
				return { response, error };
			}
		}
	),
};

const baseSelectors = {
	/**
	 * Gets the current survey.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object} Current survey object.
	 */
	getCurrentSurvey( state ) {
		return state.currentSurvey;
	},
	/**
	 * Gets the current survey session.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object} Current survey object.
	 */
	getCurrentSurveySession( state ) {
		return state.currentSurveySession;
	},

};

const store = Data.combineStores(
	fetchTriggerSurveyStore,
	fetchSendSurveyEventStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const selectors = store.selectors;

export default store;

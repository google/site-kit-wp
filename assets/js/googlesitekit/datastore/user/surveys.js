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
import { CORE_USER } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';
import { createValidatedAction } from '../../data/utils';
const { createRegistrySelector } = Data;

const fetchTriggerSurveyStore = createFetchStore( {
	baseName: 'triggerSurvey',
	controlCallback: ( { triggerID } ) => {
		return API.set( 'core', 'user', 'survey-trigger', { triggerID } );
	},
	argsToParams: ( triggerID ) => {
		return { triggerID };
	},
	// eslint-disable-next-line camelcase
	reducerCallback: ( state, { survey_payload, session } ) => {
		// We don't replace survey if we already have one.
		if ( baseSelectors.getCurrentSurvey( state ) ) {
			return state;
		}
		return {
			...state,
			currentSurvey: survey_payload,
			currentSurveySession: session,
		};
	},
	validateParams: ( { triggerID } = {} ) => {
		invariant(
			'string' === typeof triggerID && triggerID.length,
			'triggerID is required and must be a string'
		);
	},
} );

const fetchSendSurveyEventStore = createFetchStore( {
	baseName: 'sendSurveyEvent',
	controlCallback: ( { event, session } ) =>
		API.set( 'core', 'user', 'survey-event', { event, session } ),
	argsToParams: ( event, session ) => {
		return { event, session };
	},
} );

const fetchGetSurveyTimeoutsStore = createFetchStore( {
	baseName: 'getSurveyTimeouts',
	controlCallback() {
		return API.get(
			'core',
			'user',
			'survey-timeouts',
			{},
			{ useCache: false }
		);
	},
	reducerCallback( state, surveyTimeouts ) {
		return {
			...state,
			surveyTimeouts: Array.isArray( surveyTimeouts )
				? surveyTimeouts
				: [],
		};
	},
} );

const fetchSetSurveyTimeoutStore = createFetchStore( {
	baseName: 'setSurveyTimeout',
	controlCallback( { slug, timeout } ) {
		return API.set( 'core', 'user', 'survey-timeout', {
			slug,
			timeout,
		} );
	},
	reducerCallback( state, surveyTimeouts ) {
		return {
			...state,
			surveyTimeouts: Array.isArray( surveyTimeouts )
				? surveyTimeouts
				: [],
		};
	},
	argsToParams( slug, timeout ) {
		return { slug, timeout };
	},
	validateParams( { slug, timeout } = {} ) {
		invariant( slug, 'slug is required.' );
		invariant( Number.isInteger( timeout ), 'timeout must be an integer.' );
	},
} );

const baseInitialState = {
	currentSurvey: null,
	currentSurveySession: null,
	surveyTimeouts: undefined,
};

const baseActions = {
	/**
	 * Sets a timeout for the survey.
	 *
	 * @since 1.73.0
	 *
	 * @param {string} triggerID Trigger ID for the survey.
	 * @param {number} timeout   Timeout for survey.
	 * @return {Object} Object with `response` and `error`.
	 */
	setSurveyTimeout: createValidatedAction(
		( triggerID, timeout ) => {
			invariant(
				'string' === typeof triggerID && triggerID.length,
				'triggerID is required and must be a string'
			);
			invariant(
				'number' === typeof timeout,
				'timeout must be a number'
			);
		},
		function* ( triggerID, timeout ) {
			return yield fetchSetSurveyTimeoutStore.actions.fetchSetSurveyTimeout(
				triggerID,
				timeout
			);
		}
	),

	/**
	 * Triggers a survey.
	 *
	 * @since 1.34.0
	 *
	 * @param {string} triggerID     Trigger ID for the survey.
	 * @param {Object} options       Survey options.
	 * @param {number} [options.ttl] Optional. TTL for survey.
	 * @return {Object} Object with `response` and `error`.
	 */
	triggerSurvey: createValidatedAction(
		( triggerID, options = {} ) => {
			const { ttl = 0 } = options;
			invariant(
				'string' === typeof triggerID && triggerID.length,
				'triggerID is required and must be a string'
			);
			invariant( isPlainObject( options ), 'options must be an object' );
			invariant(
				'number' === typeof ttl,
				'options.ttl must be a number'
			);
		},
		function* ( triggerID, options = {} ) {
			const { ttl = 0 } = options;
			const {
				select,
				dispatch,
				__experimentalResolveSelect,
			} = yield Data.commonActions.getRegistry();

			// Bail if there is already a current survey.
			if ( select( CORE_USER ).getCurrentSurvey() ) {
				return {};
			}

			// Wait for user authentication state to be available before selecting.
			yield Data.commonActions.await(
				__experimentalResolveSelect( CORE_USER ).getAuthentication()
			);

			if ( ! select( CORE_USER ).isAuthenticated() ) {
				return {};
			}

			// Await for surveys to be resolved before checking timeouts.
			yield Data.commonActions.await(
				__experimentalResolveSelect( CORE_USER ).getSurveyTimeouts()
			);

			const isTimedOut = select( CORE_USER ).isSurveyTimedOut(
				triggerID
			);
			const isTimingOut = select( CORE_USER ).isTimingOutSurvey(
				triggerID,
				ttl
			);

			// Both isTimedOut and isTimingOut variables are already resolved since they depend on
			// the getSurveyTimeouts selector which we've resolved just before getting these variables.
			if ( ! isTimedOut && ! isTimingOut ) {
				const {
					response,
					error,
				} = yield fetchTriggerSurveyStore.actions.fetchTriggerSurvey(
					triggerID
				);

				if ( error ) {
					return { response, error };
				}

				// If TTL isn't empty, then sleep for 30s and set survey timeout.
				if ( ttl > 0 ) {
					yield new Promise( ( resolve ) => {
						setTimeout( resolve, 30000 );
					} );

					yield dispatch( CORE_USER ).setSurveyTimeout(
						triggerID,
						ttl
					);
				}
			}

			return {
				response: {},
				error: false,
			};
		}
	),

	/**
	 * Sends a survey event.
	 *
	 * @since 1.34.0
	 *
	 * @param {string} eventID   Event ID for the survey.
	 * @param {Object} eventData Event Data.
	 * @return {Object} Object with `response` and `error`.
	 */
	sendSurveyEvent: createValidatedAction(
		( eventID, eventData = {} ) => {
			invariant(
				'string' === typeof eventID && eventID.length,
				'eventID is required and must be a string'
			);
			invariant(
				isPlainObject( eventData ),
				'eventData must be an object'
			);
		},
		function* ( eventID, eventData = {} ) {
			const event = { [ eventID ]: eventData };
			const { select } = yield Data.commonActions.getRegistry();
			const session = select( CORE_USER ).getCurrentSurveySession();
			if ( session ) {
				const {
					response,
					error,
				} = yield fetchSendSurveyEventStore.actions.fetchSendSurveyEvent(
					event,
					session
				);
				return { response, error };
			}
		}
	),
};

const baseResolvers = {
	*getSurveyTimeouts() {
		const { select } = yield Data.commonActions.getRegistry();
		const surveyTimeouts = select( CORE_USER ).getSurveyTimeouts();
		if ( surveyTimeouts === undefined ) {
			yield fetchGetSurveyTimeoutsStore.actions.fetchGetSurveyTimeouts();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the current survey.
	 *
	 * @since 1.34.0
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
	 * @since 1.34.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object} Current survey session object.
	 */
	getCurrentSurveySession( state ) {
		return state.currentSurveySession;
	},

	/**
	 * Gets the completion triggers for the current survey, if one exists.
	 *
	 * @since 1.35.0
	 *
	 * @return {Array|null} Current survey's completion triggers if available; `null` if no questions/survey are found.
	 */
	getCurrentSurveyCompletions: createRegistrySelector( ( select ) => () => {
		const currentSurvey = select( CORE_USER ).getCurrentSurvey();

		return currentSurvey?.completion || null;
	} ),

	/**
	 * Gets the questions from the current survey, if one exists.
	 *
	 * @since 1.35.0
	 *
	 * @return {Array|null} Current survey's questions if available; `null` if no questions/survey are found.
	 */
	getCurrentSurveyQuestions: createRegistrySelector( ( select ) => () => {
		const currentSurvey = select( CORE_USER ).getCurrentSurvey();

		return currentSurvey?.question || null;
	} ),

	/**
	 * Gets the list of survey timeouts.
	 *
	 * @since 1.73.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string[]|undefined)} Array of surveys slugs, `undefined` if not resolved yet.
	 */
	getSurveyTimeouts( state ) {
		return state.surveyTimeouts;
	},

	/**
	 * Determines whether the survey is timed out or not.
	 *
	 * @since 1.73.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Item slug.
	 * @return {(boolean|undefined)} TRUE if timed out, otherwise FALSE, `undefined` if not resolved yet.
	 */
	isSurveyTimedOut: createRegistrySelector( ( select ) => ( state, slug ) => {
		const timeouts = select( CORE_USER ).getSurveyTimeouts();

		return timeouts === undefined ? undefined : timeouts.includes( slug );
	} ),

	/**
	 * Checks whether or not the survey is being timed out for the given slug.
	 *
	 * @since 1.73.0
	 *
	 * @param {Object} state   Data store's state.
	 * @param {string} slug    Survey slug.
	 * @param {number} timeout Timeout for survey.
	 * @return {(boolean|undefined)} True if the survey is being timed out, otherwise false.
	 */
	isTimingOutSurvey: createRegistrySelector(
		( select ) => ( state, slug, timeout ) => {
			return select( CORE_USER ).isFetchingSetSurveyTimeout(
				slug,
				timeout
			);
		}
	),
};

const store = Data.combineStores(
	fetchTriggerSurveyStore,
	fetchSendSurveyEventStore,
	fetchGetSurveyTimeoutsStore,
	fetchSetSurveyTimeoutStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;

/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { isArray, isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	commonActions,
	combineStores,
	createRegistrySelector,
} from 'googlesitekit-data';
import { createFetchStore } from '../../data/create-fetch-store';
import { createReducer } from '../../data/create-reducer';
import { CORE_SITE } from './constants';

const { getRegistry } = commonActions;

const SET_GEMINI_API_KEY = 'SET_GEMINI_API_KEY';

const SET_MEMORABLE_QUOTES_ENABLED = 'SET_MEMORABLE_QUOTES_ENABLED';
const SET_GENERATING_QUOTES = 'SET_GENERATING_QUOTES';
const SET_MEMORABLE_QUOTES_POSTS = 'SET_MEMORABLE_QUOTES_POSTS';
const SET_MEMORABLE_QUOTES = 'SET_MEMORABLE_QUOTES';
const SET_MEMORABLE_QUOTES_AUTO_PUBLISH = 'SET_MEMORABLE_QUOTES_AUTO_PUBLISH';

const SET_SITEKIT_ASSISTANT_ENABLED = 'SET_SITEKIT_ASSISTANT_ENABLED';

const settingsReducerCallback = createReducer( ( state, settings ) => {
	state.gemini.settings = settings;
} );

const fetchGetGeminiSettingsStore = createFetchStore( {
	baseName: 'getGeminiSettings',
	controlCallback: () => {
		return API.get( 'core', 'site', 'memorable-quotes', null, {
			useCache: false,
		} );
	},
	reducerCallback: settingsReducerCallback,
} );

const fetchSaveGeminiSettingsStore = createFetchStore( {
	baseName: 'saveGeminiSettings',
	controlCallback: ( { settings } ) => {
		return API.set( 'core', 'site', 'memorable-quotes', { settings } );
	},
	reducerCallback: settingsReducerCallback,
	argsToParams: ( settings ) => {
		return { settings };
	},
	validateParams: ( { settings } ) => {
		invariant(
			isPlainObject( settings ),
			'settings must be a plain object.'
		);
	},
} );

const fetchGenerateMemorableQuotesStore = createFetchStore( {
	baseName: 'generateMemorableQuotes',
	controlCallback: ( { memorableQuotesPosts } ) => {
		return API.set( 'core', 'site', 'memorable-quotes-generate', {
			settings: { memorableQuotesPosts },
		} );
	},
	reducerCallback: createReducer( ( state, settings ) => {
		state.gemini.settings = settings;
	} ),
	argsToParams: ( memorableQuotesPosts ) => {
		return { memorableQuotesPosts };
	},
	validateParams: ( { memorableQuotesPosts } ) => {
		invariant(
			isArray( memorableQuotesPosts ),
			'memorableQuotesPosts must be an array.'
		);
	},
} );

const baseInitialState = {
	gemini: {
		settings: undefined,
	},
};

const baseActions = {
	/**
	 * Saves the Gemini settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveGeminiSettings() {
		const { select } = yield getRegistry();
		const settings = select( CORE_SITE ).getGeminiSettings();

		return yield fetchSaveGeminiSettingsStore.actions.fetchSaveGeminiSettings(
			settings
		);
	},

	/**
	 * Sets the Gemini API key.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} APIKey Gemini API key.
	 * @return {Object} Redux-style action.
	 */
	setGeminiAPIKey( APIKey ) {
		return {
			type: SET_GEMINI_API_KEY,
			payload: { APIKey },
		};
	},

	/**
	 * Sets the Memorable Quotes enabled status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} memorableQuotesEnabled Memorable Quotes enabled status.
	 * @return {Object} Redux-style action.
	 */
	setMemorableQuotesEnabled( memorableQuotesEnabled ) {
		return {
			type: SET_MEMORABLE_QUOTES_ENABLED,
			payload: { memorableQuotesEnabled },
		};
	},

	/**
	 * Sets the posts used to generate Memorable Quotes.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Array} memorableQuotesPosts Array of post slugs.
	 * @return {Object} Redux-style action.
	 */
	setMemorableQuotesPosts( memorableQuotesPosts ) {
		return {
			type: SET_MEMORABLE_QUOTES_POSTS,
			payload: { memorableQuotesPosts },
		};
	},

	/**
	 * Sets the generating quotes status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {boolean} generatingQuotes Generating quotes status.
	 * @return {Object} Redux-style action.
	 */
	setGeneratingQuotes( generatingQuotes ) {
		return {
			type: SET_GENERATING_QUOTES,
			payload: { generatingQuotes },
		};
	},

	/**
	 * Generates Memorable Quotes.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*generateQuotes() {
		const { select, dispatch } = yield getRegistry();
		const settings = select( CORE_SITE ).getGeminiSettings();

		dispatch( CORE_SITE ).setGeneratingQuotes( true );

		return yield fetchGenerateMemorableQuotesStore.actions.fetchGenerateMemorableQuotes(
			settings?.memorableQuotesPosts || []
		);
	},

	/**
	 * Sets the Memorable quotes.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} memorableQuotes Memorable quotes.
	 * @return {Object} Redux-style action.
	 */
	setMemorableQuotes( memorableQuotes ) {
		return {
			type: SET_MEMORABLE_QUOTES,
			payload: { memorableQuotes },
		};
	},

	/**
	 * Sets the Memorable quotes auto publish status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {boolean} autoPublish Memorable quotes auto publish status.
	 * @return {Object} Redux-style action.
	 */
	setMemorableQuotesAutoPublish( autoPublish ) {
		return {
			type: SET_MEMORABLE_QUOTES_AUTO_PUBLISH,
			payload: { autoPublish },
		};
	},

	/**
	 * Sets the Site Kit Assistant enabled status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {boolean} enabled Site Kit Assistant enabled status.
	 * @return {Object} Redux-style action.
	 */
	setSiteKitAssistantEnabled( enabled ) {
		return {
			type: SET_SITEKIT_ASSISTANT_ENABLED,
			payload: { enabled },
		};
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_GEMINI_API_KEY:
			state.gemini.settings.APIKey = payload.APIKey;
			break;

		case SET_MEMORABLE_QUOTES_ENABLED:
			state.gemini.settings = state.gemini.settings || {};
			state.gemini.settings.memorableQuotesEnabled =
				!! payload.memorableQuotesEnabled;
			break;

		case SET_GENERATING_QUOTES:
			state.gemini.settings = state.gemini.settings || {};
			state.gemini.settings.generatingQuotes =
				!! payload.generatingQuotes;
			break;

		case SET_MEMORABLE_QUOTES_POSTS:
			state.gemini.settings.memorableQuotesPosts =
				payload.memorableQuotesPosts;
			break;

		case SET_MEMORABLE_QUOTES:
			state.gemini.settings.memorableQuotes = payload.memorableQuotes;
			break;

		case SET_MEMORABLE_QUOTES_AUTO_PUBLISH:
			state.gemini.settings.memorableQuotesAutoPublish =
				!! payload.autoPublish;
			break;

		case SET_SITEKIT_ASSISTANT_ENABLED:
			state.gemini.settings = state.gemini.settings || {};
			state.gemini.settings.siteKitAssistantEnabled = !! payload.enabled;
			break;

		default:
			break;
	}
} );

const baseSelectors = {
	/**
	 * Gets the Gemini settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} Gemini settings, or `undefined` if not loaded.
	 */
	getGeminiSettings: ( state ) => {
		return state.gemini.settings;
	},

	/**
	 * Gets the Gemini API key.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {string|undefined} Gemini API key, or `undefined` if not loaded.
	 */
	getGeminiAPIKey: createRegistrySelector( ( select ) => () => {
		const { APIKey } = select( CORE_SITE ).getGeminiSettings() || {};

		return APIKey;
	} ),

	/**
	 * Gets the Memorable Quotes enabled status.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean|undefined} Memorable Quotes enabled status, or `undefined` if not loaded.
	 */
	isMemorableQuotesEnabled: createRegistrySelector( ( select ) => () => {
		const { memorableQuotesEnabled } =
			select( CORE_SITE ).getGeminiSettings() || {};

		return memorableQuotesEnabled;
	} ),

	/**
	 * Gets the generating quotes status.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean} Generating quotes status.
	 */
	isGeneratingQuotes: createRegistrySelector( ( select ) => () => {
		const { generatingQuotes } =
			select( CORE_SITE ).getGeminiSettings() || {};

		return !! generatingQuotes;
	} ),

	/**
	 * Gets the Posts used to generate Memorable Posts.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Array|undefined} Array of post slugs, or `undefined` if not loaded.
	 */
	getMemorableQuotesPosts: createRegistrySelector( ( select ) => () => {
		const { memorableQuotesPosts } =
			select( CORE_SITE ).getGeminiSettings() || {};

		return memorableQuotesPosts;
	} ),

	/**
	 * Gets the Memorable Quotes.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} Memorable quotes, or `undefined` if not loaded.
	 */
	getMemorableQuotes: createRegistrySelector( ( select ) => () => {
		const { memorableQuotes } =
			select( CORE_SITE ).getGeminiSettings() || {};

		return memorableQuotes;
	} ),

	/**
	 * Gets the Memorable Quotes auto publish status.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean|undefined} Memorable Quotes auto publish status, or `undefined` if not loaded.
	 */
	shouldAutoPublishMemorableQuotes: createRegistrySelector(
		( select ) => () => {
			const { memorableQuotesAutoPublish } =
				select( CORE_SITE ).getGeminiSettings() || {};

			return !! memorableQuotesAutoPublish;
		}
	),

	/**
	 * Gets the Site Kit Assistant enabled status.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean|undefined} Site Kit Assistant enabled status, or `undefined` if not loaded.
	 */
	isSiteKitAssistantEnabled: createRegistrySelector( ( select ) => () => {
		const { siteKitAssistantEnabled } =
			select( CORE_SITE ).getGeminiSettings() || {};

		return !! siteKitAssistantEnabled;
	} ),
};

const baseResolvers = {
	*getGeminiSettings() {
		const { select } = yield getRegistry();

		if ( select( CORE_SITE ).getGeminiSettings() ) {
			return;
		}

		yield fetchGetGeminiSettingsStore.actions.fetchGetGeminiSettings();
	},
};

const store = combineStores(
	fetchGetGeminiSettingsStore,
	fetchSaveGeminiSettingsStore,
	fetchGenerateMemorableQuotesStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
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

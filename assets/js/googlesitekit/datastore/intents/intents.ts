/**
 * `core/intents` data store: intents.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import {
	combineStores,
	commonActions,
	createReducer,
} from 'googlesitekit-data';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '@/js/googlesitekit/data/utils';
import { CORE_INTENTS } from './constants';

export interface Intent {
	/** Slug of the intent, e.g. `ads-conversion-tracking`. */
	intent: string;
	/** Time the Site Kit Service created the intent, e.g. `2026-07-30T10:15:00Z`. */
	created: string;
	/** Data the intent screen shows, with different fields for each type of intent. */
	payload: Record< string, unknown >;
}

interface IntentParams {
	/** Slug of the intent, e.g. `ads-conversion-tracking`. */
	slug: string;
	/** One-time code the Site Kit Service created for the intent. */
	code: string;
}

interface IntentsState {
	/** Intents by slug, then by one-time code. */
	intents: Record< string, Record< string, Intent > >;
}

/**
 * Throws an error when the slug or the one-time code of an intent is missing.
 *
 * @since n.e.x.t
 *
 * @param {Object} params      The intent parameters.
 * @param {string} params.slug The intent slug.
 * @param {string} params.code The one-time code for the intent.
 * @return {void}
 */
function validateIntentParams( { slug, code }: Partial< IntentParams > ): void {
	invariant( slug, 'slug is required.' );
	invariant( code, 'code is required.' );
}

const fetchGetIntentStore = createFetchStore( {
	baseName: 'getIntent',
	controlCallback: ( { slug, code }: IntentParams ) =>
		get(
			'core',
			'intents',
			'intent',
			{ slug, intent_code: code },
			// An intent can be completed only once, so a cached response
			// could show the user an intent they already completed.
			{ useCache: false }
		),
	reducerCallback: createReducer(
		(
			state: IntentsState,
			intent: Intent,
			{ slug, code }: IntentParams
		) => {
			state.intents[ slug ] = {
				...state.intents[ slug ],
				[ code ]: intent,
			};
		}
	),
	argsToParams: ( slug: string, code: string ) => ( { slug, code } ),
	validateParams: validateIntentParams,
} );

const fetchCompleteIntentStore = createFetchStore( {
	baseName: 'completeIntent',
	controlCallback: ( { slug, code }: IntentParams ) =>
		set( 'core', 'intents', 'complete-intent', {
			slug,
			intent_code: code,
		} ),
	argsToParams: ( slug: string, code: string ) => ( { slug, code } ),
	validateParams: validateIntentParams,
	isAction: true,
} );

const baseActions = {
	/**
	 * Completes an intent on the Site Kit Service.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} slug The intent slug.
	 * @param {string} code The one-time code for the intent.
	 * @return {Object} Object with `response` and `error`. On success, `response.return_url` is the URL to send the user back to.
	 */
	completeIntent: createValidatedAction(
		( slug: string, code: string ) =>
			validateIntentParams( { slug, code } ),
		function* (
			slug: string,
			code: string
		): Generator< unknown, unknown, unknown > {
			// @ts-expect-error `createFetchStore` returns the type `Object`, which has no `actions`.
			return yield fetchCompleteIntentStore.actions.fetchCompleteIntent(
				slug,
				code
			);
		}
	),
};

const baseResolvers = {
	*getIntent(
		slug: string,
		code: string
	): Generator< unknown, void, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as WPDataRegistry;

		if (
			registry.select( CORE_INTENTS ).getIntent( slug, code ) !==
			undefined
		) {
			return;
		}

		// @ts-expect-error `createFetchStore` returns the type `Object`, which has no `actions`.
		yield fetchGetIntentStore.actions.fetchGetIntent( slug, code );
	},
};

const baseSelectors = {
	/**
	 * Gets the intent the Site Kit Service has for a slug and a one-time code.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state The data store's state.
	 * @param {string} slug  The intent slug.
	 * @param {string} code  The one-time code for the intent.
	 * @return {(Object|undefined)} Intent, or `undefined` if the intent hasn't loaded.
	 */
	getIntent(
		state: IntentsState,
		slug: string,
		code: string
	): Intent | undefined {
		validateIntentParams( { slug, code } );

		return state.intents[ slug ]?.[ code ];
	},
};

const store = combineStores( fetchGetIntentStore, fetchCompleteIntentStore, {
	initialState: { intents: {} },
	actions: baseActions,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export default store;

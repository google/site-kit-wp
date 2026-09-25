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
import { ErrorObject } from '@/js/util/errors';
import { CORE_INTENTS } from './constants';

export interface Intent {
	/** Slug of the intent, e.g. `ads-conversion-tracking`. */
	intent: string;
	/** Time the Site Kit Service created the intent, e.g. `2026-07-30T10:15:00Z`. */
	created: string;
	/** Data the Site Kit Service stores for the intent, with different fields for each type of intent. */
	payload: Record< string, unknown >;
}

interface IntentParams {
	/** Slug of the intent, e.g. `ads-conversion-tracking`. */
	slug: string;
	/** Code the Site Kit Service created for this intent, which works until the intent is completed or expires. */
	intentCode: string;
}

interface IntentsState {
	/** Intents by slug, then by intent code. */
	intents: Record< string, Record< string, Intent > >;
}

interface CompleteIntentResult {
	/** Response from the Site Kit Service, or `undefined` when the request fails. */
	response?: {
		/** URL to send the user back to. */
		// eslint-disable-next-line camelcase -- The Site Kit Service names the field `return_url`.
		return_url: string;
	};
	/** Error from the request, or `undefined` when the request succeeds. */
	error?: ErrorObject;
}

/**
 * Throws an error when the slug or the intent code is missing.
 *
 * @since n.e.x.t
 *
 * @param {Object} params            The intent parameters.
 * @param {string} params.slug       The intent slug.
 * @param {string} params.intentCode The intent code.
 * @return {void}
 */
function validateIntentParams( {
	slug,
	intentCode,
}: Partial< IntentParams > ): void {
	invariant( slug, 'slug is required.' );
	invariant( intentCode, 'intentCode is required.' );
}

const fetchGetIntentStore = createFetchStore( {
	baseName: 'getIntent',
	controlCallback: ( { slug, intentCode }: IntentParams ) =>
		get(
			'core',
			'intents',
			'intent',
			{ slug, intent_code: intentCode },
			// An intent can be completed only once, so a cached response
			// could show the user an intent they already completed.
			{ useCache: false }
		),
	reducerCallback: createReducer(
		(
			state: IntentsState,
			intent: Intent,
			{ slug, intentCode }: IntentParams
		) => {
			if ( ! state.intents[ slug ] ) {
				state.intents[ slug ] = Object.create( null );
			}
			state.intents[ slug ][ intentCode ] = intent;
		}
	),
	argsToParams: ( slug: string, intentCode: string ) => ( {
		slug,
		intentCode,
	} ),
	validateParams: validateIntentParams,
} );

const fetchCompleteIntentStore = createFetchStore( {
	baseName: 'completeIntent',
	controlCallback: ( { slug, intentCode }: IntentParams ) =>
		set( 'core', 'intents', 'complete-intent', {
			slug,
			intent_code: intentCode,
		} ),
	argsToParams: ( slug: string, intentCode: string ) => ( {
		slug,
		intentCode,
	} ),
	validateParams: validateIntentParams,
	isAction: true,
} );

const baseActions = {
	/**
	 * Completes an intent on the Site Kit Service.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} slug       The intent slug.
	 * @param {string} intentCode The intent code.
	 * @return {Object} Object with `response` and `error`. On success, `response.return_url` is the URL to send the user back to.
	 */
	completeIntent: createValidatedAction(
		( slug: string, intentCode: string ) =>
			validateIntentParams( { slug, intentCode } ),
		function* (
			slug: string,
			intentCode: string
		): Generator< unknown, CompleteIntentResult, unknown > {
			// @ts-expect-error `createFetchStore` returns the type `Object`, which has no `actions`.
			return ( yield fetchCompleteIntentStore.actions.fetchCompleteIntent(
				slug,
				intentCode
			) ) as CompleteIntentResult;
		}
	),
};

const baseResolvers = {
	*getIntent(
		slug: string,
		intentCode: string
	): Generator< unknown, void, unknown > {
		const registry =
			( yield commonActions.getRegistry() ) as WPDataRegistry;

		if (
			registry.select( CORE_INTENTS ).getIntent( slug, intentCode ) !==
			undefined
		) {
			return;
		}

		// @ts-expect-error `createFetchStore` returns the type `Object`, which has no `actions`.
		yield fetchGetIntentStore.actions.fetchGetIntent( slug, intentCode );
	},
};

const baseSelectors = {
	/**
	 * Gets the intent the Site Kit Service has for a slug and an intent code.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state      The data store's state.
	 * @param {string} slug       The intent slug.
	 * @param {string} intentCode The intent code.
	 * @return {(Object|undefined)} Intent, or `undefined` if the intent hasn't loaded.
	 */
	getIntent(
		state: IntentsState,
		slug: string,
		intentCode: string
	): Intent | undefined {
		validateIntentParams( { slug, intentCode } );

		return state.intents[ slug ]?.[ intentCode ];
	},
};

const store = combineStores( fetchGetIntentStore, fetchCompleteIntentStore, {
	initialState: { intents: Object.create( null ) },
	actions: baseActions,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export default store;

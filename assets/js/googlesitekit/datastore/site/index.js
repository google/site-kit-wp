/**
 * `core/site` data store
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
 * Internal dependencies
 */
import { combineStores, commonStore } from 'googlesitekit-data';
import cache from './cache';
import connection from './connection';
import consentMode from './consent-mode';
import conversionTracking from './conversion-tracking';
import errors from './errors';
import firstPartyMode from './first-party-mode';
import html from './html';
import info from './info';
import reset from './reset';
import enableAutoUpdate from './enable-auto-update';
import settings from './settings';
import urls from './urls';
import developerPlugin from './developer-plugin';
import { CORE_SITE } from './constants';
import notifications from './notifications';
import { createErrorStore } from '../../data/create-error-store';

const store = combineStores(
	commonStore,
	connection,
	consentMode,
	conversionTracking,
	errors,
	firstPartyMode,
	html,
	info,
	developerPlugin,
	reset,
	enableAutoUpdate,
	settings,
	urls,
	notifications,
	cache,
	createErrorStore( CORE_SITE )
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export const registerStore = ( registry ) => {
	registry.registerStore( CORE_SITE, store );
};

export default store;

/**
 * Playwright Site Kit setup utilities.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

const { wpApiFetch } = require( './api-fetch' );
const { WP_BASE_URL } = require( './constants' );
const { ensurePluginActive } = require( './plugins' );

/**
 * Sets the site verification state.
 *
 * @since n.e.x.t
 *
 * @param {Object} page Playwright page object.
 */
async function setSiteVerification( page ) {
	await wpApiFetch( page, {
		path: 'google-site-kit/v1/e2e/setup/site-verification',
		method: 'post',
		data: { verified: true },
	} );
}

/**
 * Sets the connected search console property.
 *
 * @since n.e.x.t
 *
 * @param {Object} page Playwright page object.
 */
async function setSearchConsoleProperty( page ) {
	await wpApiFetch( page, {
		path: 'google-site-kit/v1/e2e/setup/search-console-property',
		method: 'post',
		data: { property: WP_BASE_URL },
	} );
}

/**
 * Enables consent mode.
 *
 * @since n.e.x.t
 *
 * @param {Object} page Playwright page object.
 */
async function enableConsentMode( page ) {
	await wpApiFetch( page, {
		path: 'google-site-kit/v1/core/site/data/consent-mode',
		method: 'post',
		data: { data: { settings: { enabled: true } } },
	} );
}

/**
 * Sets up Site Kit with the given options.
 *
 * @since n.e.x.t
 *
 * @param {Object} page           Playwright page object.
 * @param {Object} options        Setup options.
 * @param {string} [options.auth] Auth type ('proxy' or 'gcp').
 */
async function setupSiteKit( page, { auth = 'proxy' } = {} ) {
	await ensurePluginActive( page, `e2e-tests-${ auth }-auth-plugin` );
	await setSiteVerification( page );
	await setSearchConsoleProperty( page );
}

module.exports = {
	setSiteVerification,
	setSearchConsoleProperty,
	enableConsentMode,
	setupSiteKit,
};

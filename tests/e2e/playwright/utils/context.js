/**
 * Playwright browser context utilities.
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

const { WP_BASE_URL } = require( './constants' );
const { loginAsAdmin } = require( './login' );

/**
 * Creates a new browser context, logs in as admin, runs a task, and cleans up.
 *
 * @since n.e.x.t
 *
 * @param {Object}   browser Playwright browser object.
 * @param {Function} task    Task function that receives the admin page.
 */
async function withAdminPage( browser, task ) {
	const context = await browser.newContext( { baseURL: WP_BASE_URL } );
	try {
		const adminPage = await context.newPage();
		await loginAsAdmin( adminPage );
		await task( adminPage );
		await adminPage.close();
	} finally {
		await context.close();
	}
}

/**
 * Clears consent cookies from the browser context.
 *
 * @since n.e.x.t
 *
 * @param {Object} context Playwright browser context.
 */
async function clearConsentCookies( context ) {
	const cookies = await context.cookies();
	if ( ! cookies.length ) {
		return;
	}
	const hasConsentCookie = cookies.some( ( { name } ) =>
		name.startsWith( 'wp_consent_' )
	);
	if ( hasConsentCookie ) {
		await context.clearCookies();
	}
}

module.exports = { withAdminPage, clearConsentCookies };

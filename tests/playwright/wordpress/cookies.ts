/**
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
import { BrowserContext, type Cookie, type TestInfo } from '@playwright/test';

/**
 * Internal dependencies
 */
import { getDbName } from './database';

/**
 * Manages the per-test cookies that route WordPress to the correct test
 * database and authenticate the specified user.
 *
 * @since 1.175.0
 */
export class WordPressCookies {
	/**
	 * The Playwright browser context.
	 *
	 * @since 1.175.0
	 */
	private readonly context: BrowserContext;

	/**
	 * The Playwright TestInfo object for the current test.
	 *
	 * @since 1.175.0
	 */
	private readonly testInfo: TestInfo;

	/**
	 * The base URL of the WordPress instance.
	 *
	 * @since 1.175.0
	 */
	private readonly baseURL: string;

	/**
	 * Creates a new WordPressCookies instance.
	 *
	 * @since 1.175.0
	 *
	 * @param {BrowserContext} ctx      The Playwright browser context.
	 * @param {TestInfo}       testInfo The Playwright TestInfo object for the current test.
	 * @param {string}         baseURL  The base URL of the WordPress instance.
	 */
	constructor( ctx: BrowserContext, testInfo: TestInfo, baseURL: string ) {
		this.context = ctx;
		this.testInfo = testInfo;
		this.baseURL = baseURL;
	}

	/**
	 * Adds the test cookies to the browser context.
	 *
	 * Always sets `_wp_test_db` to route WordPress to the per-test database.
	 * Also sets `_wp_test_user` when the test carries an `_wp:as-user` annotation.
	 *
	 * @since 1.175.0
	 *
	 * @return {Promise<void>} A promise that resolves when the cookies are set.
	 */
	set(): Promise< void > {
		const { hostname } = new URL( this.baseURL );
		const defaults: Omit< Cookie, 'name' | 'value' > = {
			domain: hostname,
			path: '/',
			expires: -1,
			httpOnly: false,
			secure: false,
			sameSite: 'Lax',
		};

		const cookies: Cookie[] = [
			{
				...defaults,
				name: '_wp_test_db',
				value: getDbName( this.testInfo ),
			},
		];

		const user = this.getAnnotation( '_wp:as-user' );
		if ( user ) {
			cookies.push( { ...defaults, name: '_wp_test_user', value: user } );
		}

		const featureFlags = this.getAnnotation( '_wp:feature-flags' );
		if ( featureFlags ) {
			cookies.push( {
				...defaults,
				name: '_wp_test_feature_flags',
				value: featureFlags,
			} );
		}

		const fixtures = this.getAnnotation( '_wp:fixtures' );
		if ( fixtures ) {
			cookies.push( {
				...defaults,
				name: '_wp_test_fixtures',
				value: fixtures,
			} );
		}

		return this.context.addCookies( cookies );
	}

	/**
	 * Gets an annotation from the test info.
	 *
	 * @since 1.177.0
	 *
	 * @param {string} name The name of the annotation to get.
	 * @return {string | undefined} The annotation value, or undefined if not found.
	 */
	private getAnnotation( name: string ): string | undefined {
		return this.testInfo.annotations.find( ( { type } ) => type === name )
			?.description;
	}
}

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
import { Response, type Page } from '@playwright/test';

/**
 * Represents a WordPress instance.
 *
 * @since n.e.x.t
 */
export class WordPress {
	/**
	 * The page to use for the WordPress instance.
	 *
	 * @since n.e.x.t
	 */
	readonly page: Page;

	/**
	 * The base URL of the WordPress instance.
	 *
	 * @since n.e.x.t
	 */
	readonly baseURL: string;

	/**
	 * Creates a new WordPress instance.
	 *
	 * @since n.e.x.t
	 *
	 * @param page    The page to use for the WordPress instance.
	 * @param baseURL The base URL of the WordPress instance.
	 */
	constructor( page: Page, baseURL: string ) {
		this.page = page;
		this.baseURL = baseURL;
	}

	/**
	 * Navigates to the given path.
	 *
	 * @since n.e.x.t
	 *
	 * @param  path The path to navigate to.
	 * @return {Promise<Response|null>} A promise that resolves when the page is navigated to.
	 */
	goto( path: string ): Promise< Response | null > {
		return this.page.goto( `${ this.baseURL }${ path }` );
	}

	/**
	 * Navigates to the given path in the admin area.
	 *
	 * @since n.e.x.t
	 *
	 * @param  path The path to navigate to.
	 * @return {Promise<Response|null>} A promise that resolves when the page is navigated to.
	 */
	visitAdmin( path = '' ): Promise< Response | null > {
		return this.page.goto( `${ this.baseURL }/wp-admin/${ path }` );
	}

	/**
	 * Navigates to the given path in the frontend.
	 *
	 * @since n.e.x.t
	 *
	 * @param  path The path to navigate to.
	 * @return {Promise<Response|null>} A promise that resolves when the page is navigated to.
	 */
	visitFrontend( path = '/' ): Promise< Response | null > {
		return this.page.goto( `${ this.baseURL }${ path }` );
	}
}

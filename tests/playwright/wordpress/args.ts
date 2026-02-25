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
import { BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { Connection } from 'mysql2/promise';

/**
 * Arguments for creating a new WordPress instance.
 *
 * @since n.e.x.t
 */
export type WordPressArgs = {
	/**
	 * The database connection.
	 *
	 * @since n.e.x.t
	 */
	db: Connection;

	/**
	 * The page to use for the WordPress instance.
	 *
	 * @since n.e.x.t
	 */
	page: Page;

	/**
	 * The browser context of the WordPress instance.
	 *
	 * @since n.e.x.t
	 */
	context: BrowserContext;

	/**
	 * The information about the current test.
	 *
	 * @since n.e.x.t
	 */
	testInfo: TestInfo;

	/**
	 * The base URL of the WordPress instance.
	 *
	 * @since n.e.x.t
	 */
	baseURL: string;
};

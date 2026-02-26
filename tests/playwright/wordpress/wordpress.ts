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
import { test, Response, type Page } from '@playwright/test';

/**
 * Internal dependencies
 */
import { WordPressArgs } from './args';
import { WordPressDatabase } from './database';
import { WordPressCookies } from './cookies';
import { WordPressPlugins } from './plugins';

/**
 * Represents a WordPress instance.
 *
 * @since n.e.x.t
 */
export class WordPress {
	/**
	 * Database manager.
	 *
	 * @since n.e.x.t
	 */
	private readonly database: WordPressDatabase;

	/**
	 * Cookie manager.
	 *
	 * @since n.e.x.t
	 */
	private readonly cookies: WordPressCookies;

	/**
	 * Plugin manager.
	 *
	 * @since n.e.x.t
	 */
	private readonly plugins: WordPressPlugins;

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
	 * @param args Arguments for creating a new WordPress instance.
	 */
	constructor( args: WordPressArgs ) {
		this.page = args.page;
		this.baseURL = args.baseURL;

		this.database = new WordPressDatabase( args.db, args.testInfo );
		this.cookies = new WordPressCookies(
			args.context,
			args.testInfo,
			args.baseURL
		);
		this.plugins = new WordPressPlugins( args.testInfo, args.db );
	}

	/**
	 * Prepares the WordPress environment for testing.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Promise<void>} A promise that resolves when the WordPress environment is prepared.
	 */
	async setUp(): Promise< void > {
		await test.step( 'Create database', () => this.database.create() );
		await test.step( 'Set cookies', () => this.cookies.set() );
		await test.step( 'Activate plugins', () =>
			this.plugins.activateFromAnnotations()
		);
	}

	/**
	 * Tears down the WordPress environment.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Promise<void>} A promise that resolves when the WordPress environment is torn down.
	 */
	async tearDown(): Promise< void > {
		await test.step( 'Drop database', () => this.database.drop() );
		await this.database.end();
	}

	/**
	 * Activates a plugin by its file path.
	 *
	 * @since n.e.x.t
	 *
	 * @param  pluginFile The plugin file path relative to the plugins directory (e.g. `my-plugin/my-plugin.php`).
	 * @return {Promise<void>} A promise that resolves when the plugin is activated.
	 */
	activatePlugin( pluginFile: string ): Promise< void > {
		return this.plugins.activate( pluginFile );
	}

	/**
	 * Deactivates a plugin by its file path.
	 *
	 * @since n.e.x.t
	 *
	 * @param  pluginFile The plugin file path relative to the plugins directory (e.g. `my-plugin/my-plugin.php`).
	 * @return {Promise<void>} A promise that resolves when the plugin is deactivated.
	 */
	deactivatePlugin( pluginFile: string ): Promise< void > {
		return this.plugins.deactivate( pluginFile );
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

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
import {
	test,
	Response,
	type Page,
	type TestInfo,
	type TestStepInfo,
} from '@playwright/test';

/**
 * Internal dependencies
 */
import { WordPressArgs } from './args';
import {
	WordPressDatabase,
	getDbName,
	type PHPErrorLogEntry,
} from './database';
import { WordPressCookies } from './cookies';
import { errorLogIgnoreList } from './error-log-ignore-list';
import { WordPressPlugins } from './plugins';
import { Mailpit } from './mailpit';

/**
 * Represents a WordPress instance.
 *
 * @since 1.175.0
 */
export class WordPress {
	/**
	 * Database manager.
	 *
	 * @since 1.175.0
	 */
	private readonly database: WordPressDatabase;

	/**
	 * Cookie manager.
	 *
	 * @since 1.175.0
	 */
	private readonly cookies: WordPressCookies;

	/**
	 * Plugin manager.
	 *
	 * @since 1.175.0
	 */
	private readonly plugins: WordPressPlugins;

	/**
	 * Mailpit client for email testing.
	 *
	 * @since 1.175.0
	 */
	readonly mailpit: Mailpit;

	/**
	 * The Playwright TestInfo object for the current test.
	 *
	 * @since 1.175.0
	 */
	private readonly testInfo: TestInfo;

	/**
	 * The page to use for the WordPress instance.
	 *
	 * @since 1.175.0
	 */
	readonly page: Page;

	/**
	 * The base URL of the WordPress instance.
	 *
	 * @since 1.175.0
	 */
	readonly baseURL: string;

	/**
	 * Creates a new WordPress instance.
	 *
	 * @since 1.175.0
	 *
	 * @param args Arguments for creating a new WordPress instance.
	 */
	constructor( args: WordPressArgs ) {
		this.page = args.page;
		this.baseURL = args.baseURL;
		this.testInfo = args.testInfo;

		this.database = new WordPressDatabase( args.db, args.testInfo );
		this.cookies = new WordPressCookies(
			args.context,
			args.testInfo,
			args.baseURL
		);
		this.plugins = new WordPressPlugins( args.testInfo, args.db );
		this.mailpit = new Mailpit(
			args.mailpitURL,
			`${ getDbName( args.testInfo ) }@example.com`
		);
	}

	/**
	 * Prepares the WordPress environment for testing.
	 *
	 * @since 1.175.0
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
	 * @since 1.175.0
	 *
	 * @return {Promise<void>} A promise that resolves when the WordPress environment is torn down.
	 */
	async tearDown(): Promise< void > {
		const errors = await test.step( 'Collect error log', () =>
			this.getErrorLog()
		);

		if ( errors.length > 0 ) {
			await this.testInfo.attach( 'php-error-log', {
				body: JSON.stringify( errors, null, 2 ),
				contentType: 'application/json',
			} );
		}

		await test.step( 'Drop database', async () => {
			await this.database.drop();
			await this.database.end();
		} );

		if ( this.mailpit.hasInteracted() ) {
			await test.step( 'Drop emails', () =>
				this.mailpit.deleteMessages()
			);
		}

		if ( errors.length > 0 ) {
			const uniqueErrors: string[] = [];
			errors.forEach( ( err ) => {
				let msg = `[${ err.level }] ${ err.message } (${ err.file }:${ err.line })`;
				if ( err.backtrace ) {
					msg += `\n\t${ err.backtrace
						.split( '\n' )
						.join( '\n\t' ) }`;
				}

				if ( ! uniqueErrors.includes( msg ) ) {
					uniqueErrors.push( msg );
				}
			} );

			const summary = uniqueErrors.join( '\n' );
			throw new Error(
				`${ uniqueErrors.length } PHP error(s) during test:\n${ summary }`
			);
		}
	}

	/**
	 * Returns all PHP error log entries for the current test,
	 * excluding entries that match the ignore list.
	 *
	 * @since 1.175.0
	 *
	 * @return {Promise<PHPErrorLogEntry[]>} A promise that resolves with the error log entries.
	 */
	async getErrorLog(): Promise< PHPErrorLogEntry[] > {
		const errors = await this.database.getErrorLog();
		return errors.filter( ( entry ) => ! this.isIgnoredError( entry ) );
	}

	/**
	 * Checks whether a PHP error log entry matches the ignore list.
	 *
	 * @since 1.175.0
	 *
	 * @param entry The error log entry to check.
	 * @return Whether the entry should be ignored.
	 */
	private isIgnoredError( entry: PHPErrorLogEntry ): boolean {
		const wpVersion = process.env.WP_VERSION || '5.2.21';
		const ignoredEntries = [
			...( errorLogIgnoreList.ALL || [] ),
			...( errorLogIgnoreList[ wpVersion ] || [] ),
		];

		return ignoredEntries.some( ( ignored ) =>
			entry.message.includes( ignored )
		);
	}

	/**
	 * Activates a plugin by its file path.
	 *
	 * @since 1.175.0
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
	 * @since 1.175.0
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
	 * @since 1.175.0
	 *
	 * @param  path The path to navigate to.
	 * @return {Promise<Response|null>} A promise that resolves when the page is navigated to.
	 */
	goto( path: string ): Promise< Response | null > {
		return this.page.goto( `${ this.baseURL }${ path }` );
	}

	/**
	 * Navigates to the Site Kit dashboard.
	 *
	 * @since 1.177.0
	 *
	 * @param  hash The hash to navigate to.
	 * @return {Promise<Response|null>} A promise that resolves when the page is navigated to.
	 */
	visitDashboard( hash = '' ): Promise< Response | null > {
		let stepName = 'Visit Dashboard';
		if ( hash ) {
			stepName += ` (#${ hash })`;
		}

		return test.step( stepName, () =>
			this.visitAdmin(
				`admin.php?page=googlesitekit-dashboard#${ hash }`
			)
		);
	}

	/**
	 * Navigates to the given path in the admin area.
	 *
	 * @since 1.175.0
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
	 * @since 1.175.0
	 *
	 * @param  path The path to navigate to.
	 * @return {Promise<Response|null>} A promise that resolves when the page is navigated to.
	 */
	visitFrontend( path = '/' ): Promise< Response | null > {
		return this.page.goto( `${ this.baseURL }${ path }` );
	}

	/**
	 * Makes a request to the WordPress REST API using the browser's fetch.
	 *
	 * @since 1.177.0
	 *
	 * @param  method HTTP method (e.g. 'GET', 'POST').
	 * @param  route  REST route without leading slash (e.g. 'sitekit-e2e/v1/my-endpoint').
	 * @param  init   Optional additional fetch init options (headers, body, etc.).
	 * @return {Promise<unknown>} Parsed JSON response body.
	 */
	restRequest(
		method: string,
		route: string,
		init: Omit< RequestInit, 'method' > = {}
	): Promise< unknown > {
		return this.page.evaluate(
			async ( { url, method: m, init: index } ) => {
				const response = await fetch( url, { method: m, ...index } );
				return response.json();
			},
			{
				url: `${ this.baseURL }/wp-json/${ route }`,
				method,
				init,
			}
		);
	}

	/**
	 * Declares a test step that is shown in the report.
	 *
	 * @since n.e.x.t
	 *
	 * @param  title Step name.
	 * @param  body  Step body.
	 * @return {Promise<void>} A promise that resolves when the step is finished.
	 */
	async step(
		title: string,
		body: ( step: TestStepInfo ) => Promise< void >
	) {
		await this.page.screencast.showChapter( title );
		await test.step( title, body );
	}
}

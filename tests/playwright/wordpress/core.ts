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
import { join } from 'path';
import { readFileSync } from 'fs';
import {
	BrowserContext,
	test,
	type Cookie,
	type Page,
	type TestInfo,
} from '@playwright/test';
import { Connection } from 'mysql2/promise';

/**
 * Internal dependencies
 */
import { WordPressArgs } from './args';

const BACKUP_SQL_PATH = join( __dirname, 'docker/mariadb/backup.sql' );

export class WordPressCore {
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
	readonly page: Page;

	/**
	 * The browser context of the WordPress instance.
	 *
	 * @since n.e.x.t
	 */
	readonly context: BrowserContext;

	/**
	 * The information about the current test.
	 *
	 * @since n.e.x.t
	 */
	readonly testInfo: TestInfo;

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
		this.db = args.db;
		this.page = args.page;
		this.context = args.context;
		this.testInfo = args.testInfo;
		this.baseURL = args.baseURL;
	}

	/**
	 * Prepares the WordPress environment for testing.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Promise<void>} A promise that resolves when the WordPress environment is prepared.
	 */
	async setUp(): Promise< void > {
		await test.step( 'Create database', () => this.createDatabase() );
		await test.step( 'Set cookies', () => this.setCookies() );
	}

	/**
	 * Tears down the WordPress environment.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Promise<void>} A promise that resolves when the WordPress environment is torn down.
	 */
	async tearDown(): Promise< void > {
		await test.step( 'Drop database', () => this.dropDatabase() );
		await this.db.end();
	}

	/**
	 * Creates a new database.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Promise<void>} A promise that resolves when the database is created.
	 */
	private async createDatabase(): Promise< void > {
		// Create a new database.
		const dbName = this.sanitizeDbName();
		await this.db.query( `CREATE DATABASE \`${ dbName }\`` );
		await this.db.query( `USE \`${ dbName }\`` );

		// Restore the database from the backup SQL file.
		const sql = readFileSync( BACKUP_SQL_PATH, 'utf8' );
		await this.db.query( sql );
	}

	/**
	 * Drops the database.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Promise<void>} A promise that resolves when the database is dropped.
	 */
	private async dropDatabase(): Promise< void > {
		const dbName = this.sanitizeDbName();
		await this.db.query( `DROP DATABASE IF EXISTS \`${ dbName }\`` );
	}

	/**
	 * Sets the cookies for the WordPress instance.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Promise<void>} A promise that resolves when the cookies are set.
	 */
	private setCookies(): Promise< void > {
		const baseURL = new URL( this.baseURL );
		const cookieDefaults: Omit< Cookie, 'name' | 'value' > = {
			domain: baseURL.hostname,
			path: '/',
			expires: -1,
			httpOnly: false,
			secure: false,
			sameSite: 'Lax',
		};

		const cookies: Cookie[] = [
			{
				...cookieDefaults,
				name: '_wp_test_db',
				value: this.sanitizeDbName(),
			},
		];

		// If the test specifies a user via asUser(), set the _wp_test_user cookie.
		const userAnnotation = this.testInfo.annotations.find(
			( { type } ) => type === '_wp:as-user'
		);

		if ( userAnnotation?.description ) {
			cookies.push( {
				...cookieDefaults,
				name: '_wp_test_user',
				value: userAnnotation.description,
			} );
		}

		return this.context.addCookies( cookies );
	}

	/**
	 * Sanitizes a test ID to be used as a database name.
	 *
	 * @since n.e.x.t
	 *
	 * @return {string} The sanitized database name.
	 */
	private sanitizeDbName(): string {
		const { testId: testID } = this.testInfo; // eslint-disable-line sitekit/acronym-case
		return 'wp_' + testID.replace( /[^a-zA-Z0-9]/g, '_' ).slice( 0, 50 );
	}
}

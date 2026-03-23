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
import { Connection, RowDataPacket } from 'mysql2/promise';
import { type TestInfo } from '@playwright/test';

const BACKUP_SQL_PATH = join( __dirname, '../docker/mariadb/backup.sql' );

/**
 * Represents a PHP error log entry stored in the per-test database.
 *
 * @since 1.175.0
 */
export interface PHPErrorLogEntry {
	id: number;
	timestamp: string;
	level: string;
	message: string;
	file: string;
	line: number;
	backtrace: string | null;
}

/**
 * Returns a database name derived from a Playwright test ID.
 *
 * @since 1.175.0
 *
 * @param  testInfo The Playwright TestInfo object for the current test.
 * @return {string} A valid MySQL database name.
 */
export function getDbName( testInfo: TestInfo ): string {
	const { testId: testID } = testInfo; // eslint-disable-line sitekit/acronym-case
	return 'wp_' + testID.replace( /[^a-zA-Z0-9]/g, '_' ).slice( 0, 50 );
}

/**
 * Manages the per-test WordPress database.
 *
 * @since 1.175.0
 */
export class WordPressDatabase {
	/**
	 * The database connection for the current test.
	 *
	 * @since 1.175.0
	 */
	private readonly db: Connection;

	/**
	 * The Playwright TestInfo object for the current test.
	 *
	 * @since 1.175.0
	 */
	private readonly testInfo: TestInfo;

	/**
	 * Creates a new WordPressDatabase instance.
	 *
	 * @since 1.175.0
	 *
	 * @param {Connection} db       The database connection.
	 * @param {TestInfo}   testInfo The Playwright TestInfo object for the current test.
	 */
	constructor( db: Connection, testInfo: TestInfo ) {
		this.db = db;
		this.testInfo = testInfo;
	}

	/**
	 * Creates the test database and restores it from the backup snapshot.
	 *
	 * @since 1.175.0
	 *
	 * @return {Promise<void>} A promise that resolves when the database is ready.
	 */
	async create(): Promise< void > {
		const name = getDbName( this.testInfo );
		await this.db.query( `CREATE DATABASE \`${ name }\`` );
		await this.db.query( `USE \`${ name }\`` );

		const sql = readFileSync( BACKUP_SQL_PATH, 'utf8' );
		await this.db.query( sql );
	}

	/**
	 * Drops the test database.
	 *
	 * @since 1.175.0
	 *
	 * @return {Promise<void>} A promise that resolves when the database is dropped.
	 */
	async drop(): Promise< void > {
		const name = getDbName( this.testInfo );
		await this.db.query( `DROP DATABASE IF EXISTS \`${ name }\`` );
	}

	/**
	 * Returns all PHP error log entries for the current test.
	 *
	 * @since 1.175.0
	 *
	 * @return {Promise<PHPErrorLogEntry[]>} A promise that resolves with the error log entries.
	 */
	async getErrorLog(): Promise< PHPErrorLogEntry[] > {
		const [ rows ] = await this.db.query< RowDataPacket[] >(
			'SELECT * FROM `wp_e2e_error_log` ORDER BY `id` ASC'
		);
		return rows as PHPErrorLogEntry[];
	}

	/**
	 * Closes the underlying database connection.
	 *
	 * @since 1.175.0
	 *
	 * @return {Promise<void>} A promise that resolves when the connection is closed.
	 */
	end(): Promise< void > {
		return this.db.end();
	}
}

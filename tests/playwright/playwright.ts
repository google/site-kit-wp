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
import { test as base, type Cookie } from '@playwright/test';
import { createConnection } from 'mysql2/promise';

export { expect, TestDetails } from '@playwright/test';

/**
 * Internal dependencies
 */
import { WordPress } from './wordpress';

const WP_BASE_URL = process.env.PLAYWRIGHT_WP_URL ?? 'http://localhost:9002';
const BACKUP_SQL_PATH = join( __dirname, 'docker/mariadb/backup.sql' );

/**
 * Sanitizes a test ID to be used as a database name.
 *
 * @since n.e.x.t
 *
 * @param  testID The ID of the test.
 * @return {string} The sanitized database name.
 */
function sanitizeDbName( testID: string ): string {
	return 'wp_' + testID.replace( /[^a-zA-Z0-9]/g, '_' ).slice( 0, 50 );
}

/**
 * Creates a new database with the given name.
 *
 * @since n.e.x.t
 *
 * @param  dbName The name of the database to create.
 * @return {Promise<void>} A promise that resolves when the database is created.
 */
async function createDatabase( dbName: string ): Promise< void > {
	// Create a connection to the database.
	const connection = await createConnection( {
		host: 'localhost',
		port: 9306,
		user: 'root',
		password: 'example',
		multipleStatements: true,
	} );

	try {
		// Create a new database.
		await connection.query( `CREATE DATABASE \`${ dbName }\`` );
		await connection.query( `USE \`${ dbName }\`` );
		const sql = readFileSync( BACKUP_SQL_PATH, 'utf8' );
		await connection.query( sql );
	} finally {
		// Close the connection.
		await connection.end();
	}
}

/**
 * Drops the database with the given name.
 *
 * @since n.e.x.t
 *
 * @param  dbName The name of the database to drop.
 * @return {Promise<void>} A promise that resolves when the database is dropped.
 */
async function dropDatabase( dbName: string ): Promise< void > {
	const connection = await createConnection( {
		host: 'localhost',
		port: 9306,
		user: 'root',
		password: 'example',
	} );
	try {
		await connection.query( `DROP DATABASE IF EXISTS \`${ dbName }\`` );
	} finally {
		await connection.end();
	}
}

/**
 * Type definition for the WordPress fixture.
 *
 * @since n.e.x.t
 */
type WordPressFixture = {
	wp: WordPress;
};

/**
 * Test class with WordPress fixture.
 *
 * @since n.e.x.t
 */
export const test = base.extend< WordPressFixture >( {
	wp: async ( { page, context }, use, testInfo ) => {
		// Create a unique database for each test.
		const dbName = sanitizeDbName( testInfo.testId ); // eslint-disable-line sitekit/acronym-case
		await createDatabase( dbName );

		try {
			const baseURL = new URL( WP_BASE_URL );
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
					value: dbName,
				},
			];

			// If the test specifies a user via asUser(), set the _wp_test_user cookie.
			const userAnnotation = testInfo.annotations.find(
				( { type } ) => type === '_wp:as-user'
			);
			if ( userAnnotation?.description ) {
				cookies.push( {
					...cookieDefaults,
					name: '_wp_test_user',
					value: userAnnotation.description,
				} );
			}

			await context.addCookies( cookies );

			// Use the WordPress fixture.
			await use( new WordPress( page, WP_BASE_URL ) );
		} finally {
			// Clean up the database.
			await dropDatabase( dbName );
		}
	},
} );

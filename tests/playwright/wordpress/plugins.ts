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
import { TestInfo, test } from '@playwright/test';
import { type Connection, type RowDataPacket } from 'mysql2/promise';

/**
 * Internal dependencies
 */
import { ANNOTATION_SEPARATOR } from './options';

/**
 * Serializes a string array to a PHP serialized format.
 *
 * @since 1.175.0
 *
 * @param  arr The array to serialize.
 * @return {string} The PHP serialized string.
 */
function phpSerializeStringArray( arr: string[] ): string {
	const items = arr
		.map(
			( v, index ) =>
				`i:${ index };s:${ Buffer.byteLength( v, 'utf8' ) }:"${ v }";`
		)
		.join( '' );
	return `a:${ arr.length }:{${ items }}`;
}

/**
 * Parses a PHP serialized string array into a JavaScript array.
 *
 * @since 1.175.0
 *
 * @param  serialized The PHP serialized string.
 * @return {string[]} The parsed array.
 */
function phpUnserializeStringArray( serialized: string ): string[] {
	// Matches PHP string entries: s:LEN:"VALUE";
	// Plugin file paths are ASCII-only so this simple approach is safe.
	const result: string[] = [];
	const regex = /s:\d+:"([^"]*)"/g;
	let match;
	while ( ( match = regex.exec( serialized ) ) !== null ) {
		result.push( match[ 1 ] );
	}
	return result;
}

/**
 * Manages WordPress plugin activation and deactivation by directly updating
 * the `active_plugins` option in the per-test database.
 *
 * The database connection is already pointed at the test-specific database
 * after `WordPressDatabase.create()` runs `USE <db_name>`, so all queries
 * go to the correct isolated database without any cookie or HTTP dependencies.
 *
 * @since 1.175.0
 */
export class WordPressPlugins {
	/**
	 * The Playwright TestInfo object for the current test.
	 *
	 * @since 1.175.0
	 */
	private readonly testInfo: TestInfo;

	/**
	 * The database connection, already scoped to the test database.
	 *
	 * @since 1.175.0
	 */
	private readonly db: Connection;

	/**
	 * Creates a new WordPressPlugins instance.
	 *
	 * @since 1.175.0
	 *
	 * @param {TestInfo}   testInfo The Playwright TestInfo object for the current test.
	 * @param {Connection} db       The database connection scoped to the test database.
	 */
	constructor( testInfo: TestInfo, db: Connection ) {
		this.testInfo = testInfo;
		this.db = db;
	}

	/**
	 * Returns the current list of active plugins from the database.
	 *
	 * @since 1.175.0
	 *
	 * @return {Promise<string[]>} A promise that resolves with the active plugin file paths.
	 */
	private async getActivePlugins(): Promise< string[] > {
		const [ rows ] = await this.db.execute< RowDataPacket[] >(
			'SELECT option_value FROM wp_options WHERE option_name = "active_plugins"'
		);
		if ( ! rows.length ) {
			return [];
		}
		return phpUnserializeStringArray( rows[ 0 ].option_value as string );
	}

	/**
	 * Writes the given list of active plugins to the database.
	 *
	 * @since 1.175.0
	 *
	 * @param  plugins The plugin file paths to set as active.
	 * @return {Promise<void>} A promise that resolves when the option is updated.
	 */
	private async setActivePlugins( plugins: string[] ): Promise< void > {
		const value = phpSerializeStringArray( plugins );
		await this.db.execute(
			'UPDATE wp_options SET option_value = ? WHERE option_name = "active_plugins"',
			[ value ]
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
	activate( pluginFile: string ): Promise< void > {
		return test.step( `Activate plugin: ${ pluginFile }`, async () => {
			const plugins = await this.getActivePlugins();
			if ( ! plugins.includes( pluginFile ) ) {
				plugins.push( pluginFile );
				await this.setActivePlugins( plugins );
			}
		} );
	}

	/**
	 * Deactivates a plugin by its file path.
	 *
	 * @since 1.175.0
	 *
	 * @param  pluginFile The plugin file path relative to the plugins directory (e.g. `my-plugin/my-plugin.php`).
	 * @return {Promise<void>} A promise that resolves when the plugin is deactivated.
	 */
	deactivate( pluginFile: string ): Promise< void > {
		return test.step( `Deactivate plugin: ${ pluginFile }`, async () => {
			const plugins = await this.getActivePlugins();
			const updated = plugins.filter( ( p ) => p !== pluginFile );
			if ( updated.length !== plugins.length ) {
				await this.setActivePlugins( updated );
			}
		} );
	}

	/**
	 * Activates all plugins listed in the test's `_wp:plugin` annotations.
	 *
	 * Does nothing when no `_wp:plugin` annotations are present.
	 *
	 * @since 1.175.0
	 *
	 * @return {Promise<void>} A promise that resolves when all plugins are activated.
	 */
	async activateFromAnnotations(): Promise< void > {
		const pluginFiles: string[] = [];

		this.testInfo.annotations.forEach( ( { type, description = '' } ) => {
			if ( type !== '_wp:plugin' ) {
				return;
			}

			description
				.split( ANNOTATION_SEPARATOR )
				.forEach( ( pluginFile: string ) => {
					pluginFiles.push( pluginFile );
				} );
		} );

		for ( const pluginFile of pluginFiles ) {
			await this.activate( pluginFile );
		}
	}
}

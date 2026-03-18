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
 * PHP error log entries to ignore, keyed by WordPress version.
 *
 * Use `ALL` for entries that should be ignored regardless of WP version.
 * Each entry is a substring match against the error message.
 *
 * @since n.e.x.t
 */
export const errorLogIgnoreList: Record< string, string[] > = {
	'5.2.21': [
		// Deprecated syntax or function calls which are fixed in later WP versions.
		'Function get_magic_quotes_gpc() is deprecated',
		'Array and string offset access syntax with curly braces is deprecated',
		'Passing glue string after array is deprecated. Swap the parameters',

		// These are guarded against in later WP versions.
		'Trying to access array offset on value of type bool',
		'Trying to access array offset on value of type null',
	],
	// Entries that should be ignored in all versions.
	ALL: [
		// See: https://core.trac.wordpress.org/ticket/62462
		'Function _load_textdomain_just_in_time was called',
	],
};

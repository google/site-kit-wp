/**
 * `core/site` data store: golinks.
 *
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
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { Select, createRegistrySelector } from 'googlesitekit-data';
import { CORE_SITE } from './constants';

export const selectors = {
	/**
	 * Gets the Site Kit golink URL for a given key.
	 *
	 * Builds the URL of shape `{adminURL}index.php?action=googlesitekit_go&to={key}`,
	 * appending any extra query args (e.g. `permaLink` for entity-dashboard links).
	 *
	 * The URL shape is deterministic from the admin URL plus the handler key, mirroring
	 * the server-side `Golinks::get_url` contract. The server decides handler validity
	 * at click time, so the selector still produces a URL for unknown keys.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state  Data store's state.
	 * @param {string} key    Golink handler key (e.g. `dashboard`).
	 * @param {Object} [args] Optional extra query args to append.
	 * @return {(string|undefined)} Golink URL, or `undefined` when the admin URL is not yet available.
	 */
	getGoLinkURL: createRegistrySelector(
		( select: Select ) =>
			(
				state: unknown,
				key: string,
				args: Record< string, unknown > = {}
			): string | undefined => {
				const adminURL = select( CORE_SITE ).getSiteInfo()?.adminURL;

				if ( ! adminURL ) {
					return undefined;
				}

				const baseURL = adminURL.endsWith( '/' )
					? adminURL
					: `${ adminURL }/`;

				return addQueryArgs( `${ baseURL }index.php`, {
					action: 'googlesitekit_go',
					to: key,
					...args,
				} );
			}
	),
};

export default {
	selectors,
};

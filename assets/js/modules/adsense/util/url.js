/**
 * URL utilities.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { parse as pslParse } from 'psl';

/**
 * Parses a URL to retrieve the domain.
 *
 * @since 1.14.0
 *
 * @param {string} url The url to parse.
 * @return {string} The domain of the url passed.
 */
export const parseDomain = ( url ) => {
	const urlObj = new URL( url );
	const { domain } = pslParse( urlObj.hostname );
	return domain;
};

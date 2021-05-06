/**
 * Absolute URL path getter utility function.
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
 * Returns the absolute URL from a path including the siteURL.
 *
 * @since 1.32.0
 *
 * @param {string} siteURL The siteURL fo the WordPress install.
 * @param {string} path    The path.
 * @return {string} The URL path.
 */
export function getFullURL( siteURL, path ) {
	return new URL( path, siteURL ).href;
}

export default getFullURL;

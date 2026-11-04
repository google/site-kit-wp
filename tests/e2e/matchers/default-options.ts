/**
 * Default options for the element matchers.
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

export interface DefaultOptions {
	// Maximum time to wait, in milliseconds.
	timeout: number;
	// Time between checks, in milliseconds.
	polling: number;
}

const defaultOptions: DefaultOptions = { timeout: 500, polling: 100 };

/**
 * Sets the default options for the element matchers.
 *
 * @since 1.191.0
 *
 * @param  options Options to merge into the defaults.
 * @return {void}
 */
export function setDefaultOptions( options: Partial< DefaultOptions > ) {
	Object.assign( defaultOptions, options );
}

/**
 * Gets the default options for the element matchers.
 *
 * @since 1.191.0
 *
 * @return Default options.
 */
export function getDefaultOptions(): DefaultOptions {
	return { ...defaultOptions };
}

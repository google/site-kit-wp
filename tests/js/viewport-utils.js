/**
 * Viewport utilities.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * Retrieves the viewport width.
 *
 * @since 1.85.0
 *
 * @return {number} The current viewport width.
 */
export function getViewportWidth() {
	return global.innerWidth;
}

/**
 * Sets the viewport width.
 *
 * @since 1.85.0
 *
 * @param {number} viewportWidth The viewport width to set.
 */
export function setViewportWidth( viewportWidth ) {
	Object.defineProperty( global, 'innerWidth', {
		configurable: true,
		value: viewportWidth,
	} );
}

/**
 * Retrieves the viewport height.
 *
 * @since 1.180.0
 *
 * @return {number} The current viewport height.
 */
export function getViewportHeight() {
	return global.innerHeight;
}

/**
 * Sets the viewport height.
 *
 * @since 1.180.0
 *
 * @param {number} viewportHeight The viewport height to set.
 */
export function setViewportHeight( viewportHeight ) {
	Object.defineProperty( global, 'innerHeight', {
		configurable: true,
		value: viewportHeight,
	} );
}

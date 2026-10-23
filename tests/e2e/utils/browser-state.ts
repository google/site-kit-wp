/**
 * Browser state utilities.
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

interface Viewport {
	width: number;
	height: number;
}

/**
 * Viewport sizes to refer to by name.
 */
const VIEWPORTS = {
	large: { width: 960, height: 700 },
	medium: { width: 768, height: 700 },
	small: { width: 600, height: 700 },
};

/**
 * Clears the local storage.
 *
 * @since n.e.x.t
 *
 * @return Resolves once the local storage is empty.
 */
export async function clearLocalStorage() {
	await page.evaluate( () => window.localStorage.clear() );
}

/**
 * Accepts every dialog the page opens, such as the "leave site" prompt.
 *
 * @since n.e.x.t
 *
 * @return {void}
 */
export function enablePageDialogAccept() {
	page.on( 'dialog', ( dialog ) => dialog.accept() );
}

/**
 * Sets the browser viewport size.
 *
 * @since n.e.x.t
 *
 * @param viewport Viewport name, or `width` and `height`.
 * @return Resolves once the viewport has the new size.
 */
export async function setBrowserViewport(
	viewport: keyof typeof VIEWPORTS | Viewport
) {
	const { width, height } =
		typeof viewport === 'string' ? VIEWPORTS[ viewport ] : viewport;
	await page.setViewportSize( { width, height } );
}

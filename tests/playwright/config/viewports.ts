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
import { devices } from '@playwright/test';

/**
 * Creates a project with a specific viewport.
 *
 * @since n.e.x.t
 *
 * @param name   The name of the project.
 * @param device The device to use for the project.
 * @param width  The width of the viewport.
 * @param height The height of the viewport.
 * @return      The project configuration.
 */
function withViewport(
	name: string,
	device: string,
	width: number,
	height: number
) {
	return {
		name,
		use: {
			...devices[ device ],
			viewport: { width, height },
		},
	};
}

/**
 * Creates a project with a mobile viewport.
 *
 * @since n.e.x.t
 *
 * @param name   The name of the project.
 * @param device The device to use for the project.
 * @return      The project configuration.
 */
export function withMobileViewport( name: string, device: string ) {
	return withViewport( name, device, 450, 900 );
}

/**
 * Creates a project with a tablet viewport.
 *
 * @since n.e.x.t
 *
 * @param name   The name of the project.
 * @param device The device to use for the project.
 * @return      The project configuration.
 */
export function withTabletViewport( name: string, device: string ) {
	return withViewport( name, device, 600, 900 );
}

/**
 * Creates a project with a desktop viewport.
 *
 * @since n.e.x.t
 *
 * @param name   The name of the project.
 * @param device The device to use for the project.
 * @return      The project configuration.
 */
export function withDesktopViewport( name: string, device: string ) {
	return withViewport( name, device, 960, 900 );
}

/**
 * Creates a project with a large viewport.
 *
 * @since n.e.x.t
 *
 * @param name   The name of the project.
 * @param device The device to use for the project.
 * @return      The project configuration.
 */
export function withLargeViewport( name: string, device: string ) {
	return withViewport( name, device, 1440, 900 );
}

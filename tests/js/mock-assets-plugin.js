/**
 * Mock Assets Plugin for Vitest.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

/**
 * Creates a Vite plugin to mock SVG and media file imports for testing.
 *
 * @since n.e.x.t
 *
 * @return {Object} Vite plugin configuration object.
 */
export default function mockAssetsPlugin() {
	const svgrMockPath = path.resolve( __dirname, './svgrMock.js' );
	const svgStringMockPath = path.resolve( __dirname, './svgStringMock.js' );
	const fileMockPath = path.resolve( __dirname, './fileMock.js' );

	return {
		name: 'mock-assets',
		enforce: 'pre',
		// eslint-disable-next-line sitekit/acronym-case
		resolveId( id ) {
			// Handle SVG imports with ?url suffix
			if ( id.endsWith( '.svg?url' ) ) {
				return svgStringMockPath;
			}
			// Handle regular SVG imports
			if ( id.endsWith( '.svg' ) ) {
				return svgrMockPath;
			}
			// Handle other media file imports
			if (
				/\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$/.test(
					id
				)
			) {
				return fileMockPath;
			}
			return null;
		},
	};
}

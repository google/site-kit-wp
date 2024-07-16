/**
 * Storybook main config.
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
 * Node dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

const vrtStyles = fs.readFileSync(
	path.resolve( __dirname, 'preview-head-vrt.html' ),
	{
		encoding: 'utf-8',
	}
);

module.exports = {
	stories: [ '../stories/**/*.stories.js', '../assets/js/**/*.stories.js' ],
	addons: [ '@storybook/addon-viewport', '@storybook/addon-postcss' ],
	previewHead( head ) {
		return process.env.VRT === '1' ? `${ head }\n${ vrtStyles }` : head;
	},
	staticDirs: [ '../dist' ],
	core: {
		disableTelemetry: true,
	},
};

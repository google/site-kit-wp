/**
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

const path = require( 'path' );

function getModuleAbsolutePath( packageName ) {
	return path.dirname(
		require.resolve( path.join( packageName, 'package.json' ) )
	);
}

module.exports = {
	preset: getModuleAbsolutePath( '@wordpress/jest-preset-default' ),
	rootDir: '../../',
	transform: {
		'^.+\\.[jt]sx?$': '<rootDir>/tests/js/babel-transform.js',
	},
	setupFiles: [
		'<rootDir>/tests/js/setup-globals',
		'jest-localstorage-mock',
	],
	setupFilesAfterEnv: [
		'<rootDir>/tests/js/jest-matchers',
		'<rootDir>/tests/js/setup-before-after',
	],
	testMatch: [
		'<rootDir>/assets/**/__tests__/**/*.js',
		'<rootDir>/assets/**/test/*.js',
		'<rootDir>/assets/**/?(*.)test.js',
		'<rootDir>/packages/**/__tests__/**/*.js',
		'<rootDir>/packages/**/test/*.js',
		'<rootDir>/packages/**/?(*.)test.js',
		'<rootDir>/tests/js/**/?(*.)test.js',
	],
	testPathIgnorePatterns: [
		'<rootDir>/.git',
		'<rootDir>/node_modules',
		'<rootDir>/assets/node_modules',
		'<rootDir>/build',
	],
	modulePathIgnorePatterns: [ '<rootDir>/.vscode' ],
	transformIgnorePatterns: [ '<rootDir>/assets/node_modules/' ],
	// Matches aliases in webpack.config.js.
	moduleNameMapper: {
		// New (JSR) modules.
		'^googlesitekit-(.+)$': '<rootDir>assets/js/googlesitekit-$1',
		// Necessary mock to prevent test failures caused by SVGR
		'\\.svg$': '<rootDir>/tests/js/svgrMock.js',
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'<rootDir>/tests/js/fileMock.js',
	},
};

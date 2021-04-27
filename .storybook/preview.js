/**
 * Storybook preview config.
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
 * Internal dependencies
 */
import '../assets/sass/wpdashboard.scss';
import '../assets/sass/adminbar.scss';
import '../assets/sass/admin.scss';
import './assets/sass/wp-admin.scss';
// Ensure all globals are setup before any other imports are run.
import './polyfill-globals';
import { resetGlobals } from './utils/resetGlobals';
import { bootstrapFetchMocks } from './fetch-mocks';
import { WithTestRegistry } from '../tests/js/utils';

bootstrapFetchMocks();

export const decorators = [
	( Story ) => (
		<WithTestRegistry>
			<div className="googlesitekit-plugin-preview js">
				<div className="googlesitekit-plugin">
					<Story />
				</div>
			</div>
		</WithTestRegistry>
	),
	// Decorators run from last added to first
	( Story ) => {
		resetGlobals();

		return <Story />;
	},
];

export const parameters = {
	layout: 'fullscreen',
};

// TODO Would be nice if this wrote to a file. This logs our Storybook data to the browser console. Currently it gets put in .storybook/storybook-data and used in tests/backstop/scenarios.js.
// eslint-disable-next-line no-console
console.log( '__STORYBOOK_CLIENT_API__.raw()', global.__STORYBOOK_CLIENT_API__.raw() );

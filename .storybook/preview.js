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
 * External dependencies
 */
import { useFirstMountState, useUnmount } from 'react-use';

/**
 * Internal dependencies
 */
import '../assets/sass/wpdashboard.scss';
import '../assets/sass/adminbar.scss';
import '../assets/sass/admin.scss';
import './assets/sass/wp-admin.scss';
// Ensure all globals are set up before any other imports are run.
import './polyfill-globals';
import { resetGlobals } from './utils/resetGlobals';
import { bootstrapFetchMocks } from './fetch-mocks';
import { WithTestRegistry } from '../tests/js/utils';
import { enabledFeatures } from '../assets/js/features';

bootstrapFetchMocks();

// Decorators run from last added to first. (Eg. In reverse order as listed.)
export const decorators = [
	( Story, { parameters } ) => {
		const styles = {};

		const { padding } = parameters || {};
		if ( padding !== undefined ) {
			styles.padding = padding;
		}

		return (
			<div className="googlesitekit-plugin-preview js mdc-layout-grid" style={ styles }>
				<div className="mdc-layout-grid__inner">
					<div className="googlesitekit-plugin mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
						<Story />
					</div>
				</div>
			</div>
		);
	},
	// Features must be set up before test registry is initialized.
	( Story, { parameters } ) => {
		const { features = [] } = parameters;
		const isFirstMount = useFirstMountState();
		useUnmount( () => enabledFeatures.clear() );

		if ( isFirstMount ) {
			enabledFeatures.clear();
			features.forEach( ( feature ) => enabledFeatures.add( feature ) );
		}

		return (
			<WithTestRegistry features={ features }>
				<Story />
			</WithTestRegistry>
		);
	},
	( Story ) => {
		resetGlobals();

		return <Story />;
	},
];

export const parameters = {
	layout: 'fullscreen',
};

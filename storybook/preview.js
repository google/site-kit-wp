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
import './assets/sass/stories/tokens.scss';
import './assets/sass/stories/type-scale.scss';
// Ensure all globals are set up before any other imports are run.
import './polyfill-globals';
import { setUsingCache } from 'googlesitekit-api';
import { resetGlobals } from './utils/resetGlobals';
import { bootstrapFetchMocks } from './fetch-mocks';
import { WithTestRegistry } from '../tests/js/utils';
import { enabledFeatures } from '../assets/js/features';
import { Cell, Grid, Row } from '../assets/js/material-components';

setUsingCache( false );

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
			<Grid className="googlesitekit-plugin-preview js" style={ styles }>
				<Row>
					<Cell size={ 12 } className="googlesitekit-plugin">
						<Story />
					</Cell>
				</Row>
			</Grid>
		);
	},
	// Features must be set up before test registry is initialized.
	( Story, { parameters } ) => {
		const { features = [], route } = parameters;
		const isFirstMount = useFirstMountState();
		useUnmount( () => enabledFeatures.clear() );

		if ( isFirstMount ) {
			enabledFeatures.clear();
			for ( const feature of features ) {
				enabledFeatures.add( feature );
			}
		}

		return (
			<WithTestRegistry
				features={ features }
				route={ route }
				// Expose registry as global for tinkering.
				callback={ ( registry ) => {
					global.registry = registry;
				} }
			>
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
	options: {
		storySort: {
			method: 'alphabetical',
		},
	},
	async puppeteerTest( page ) {
		await page.waitForTimeout( 50 );

		expect(
			await page.$eval( 'body', ( el ) =>
				el.classList.contains( 'sb-show-errordisplay' )
			)
		).toBe( false );
	},
};

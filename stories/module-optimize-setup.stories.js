/**
 * Optimize Setup stories.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { storiesOf } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { removeAllFilters, addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import SetupWrapper from '../assets/js/components/setup/setup-wrapper';
import { SetupMain as OptimizeSetup } from '../assets/js/modules/optimize/setup/index';
import { fillFilterWithComponent } from '../assets/js/util';

import { STORE_NAME } from '../assets/js/modules/optimize/datastore/constants';
import { WithTestRegistry } from '../tests/js/utils';

function filterOptimizeSetup() {
	global._googlesitekitLegacyData.setup.moduleToSetup = 'optimize';

	removeAllFilters( 'googlesitekit.ModuleSetup-optimize' );
	addFilter(
		'googlesitekit.ModuleSetup-optimize',
		'googlesitekit.OptimizeModuleSetupWizard',
		fillFilterWithComponent( OptimizeSetup )
	);
}

function Setup( props ) {
	return (
		<WithTestRegistry { ...props }>
			<SetupWrapper />
		</WithTestRegistry>
	);
}

storiesOf( 'Optimize Module/Setup', module )
	.add( 'Start', () => {
		filterOptimizeSetup();

		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setSettings( {} );
		};

		return <Setup callback={ setupRegistry } />;
	} )
;

/**
 * ReportZero stories.
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
 * Internal dependencies
 */
import Modules from 'googlesitekit-modules';
import {
	createTestRegistry,
	WithTestRegistry,
} from '../tests/js/utils';

import ReportZero from '../assets/js/components/ReportZero';

const { createModuleStore } = Modules;

storiesOf( 'Global', module )
	.addDecorator( ( storyFn ) => {
		const registry = createTestRegistry();
		const testModuleDefinition = createModuleStore( 'test-module' );
		registry.registerStore( testModuleDefinition.STORE_NAME, testModuleDefinition );
		registry.dispatch( 'core/modules' ).registerModule( 'test-module', { name: 'Test Module' } );
		return storyFn( registry );
	} )
	.add( 'ReportZero', ( registry ) => (
		<WithTestRegistry registry={ registry }>
			<ReportZero moduleSlug="test-module" />
		</WithTestRegistry>
	) );

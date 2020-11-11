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
	provideModules,
	WithTestRegistry,
} from '../tests/js/utils';

import ReportError from '../assets/js/components/ReportError.js';

const { createModuleStore } = Modules;

const error = {
	code: 'missing_required_param',
	message: 'Request parameter is empty: metrics.',
	data: {},
};

storiesOf( 'Global', module )
	.addDecorator( ( storyFn ) => {
		const registry = createTestRegistry();
		const testModuleDefinition = createModuleStore( 'test-module' );
		registry.registerStore( testModuleDefinition.STORE_NAME, testModuleDefinition );
		registry.dispatch( 'core/modules' ).registerModule( 'test-module', { name: 'Test Module' } );
		return storyFn( registry );
	} )
	.add( 'ReportError', ( registry ) => (
		<WithTestRegistry registry={ registry }>
			<ReportError moduleSlug="test-module" error={ error } />
		</WithTestRegistry>
	) );

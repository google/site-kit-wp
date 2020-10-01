/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
import { set } from 'lodash';

/**
 * Internal dependencies
 */
import UserInputApp from '../assets/js/components/user-input/UserInputApp';
import { WithTestRegistry, createTestRegistry } from '../tests/js/utils';

storiesOf( 'User Input', module )
	.add( 'User Input Page', () => {
		// Set the featureFlag.
		set( global, 'featureFlags.widgets.userInput.enabled', true );
		return (
			<WithTestRegistry callback={ createTestRegistry }>
				<UserInputApp />
			</WithTestRegistry>
		);
	} )
	.add( 'No Access', () => {
		// Set the featureFlag.
		set( global, 'featureFlags.widgets.userInput.enabled', false );
		return (
			<WithTestRegistry callback={ createTestRegistry }>
				<UserInputApp />
			</WithTestRegistry>
		);
	} );

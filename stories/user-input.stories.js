/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import UserInputApp from '../assets/js/components/user-input/UserInputApp';
import { WithTestRegistry, createTestRegistry } from '../tests/js/utils';

storiesOf( 'User Input', module )
	.add( 'UserInputApp', () => {
		// Set the featureFlag.
		global.featureFlags = { widgets: { userInput: { enabled: true } } };
		return (
			<WithTestRegistry callback={ createTestRegistry }>
				<UserInputApp />
			</WithTestRegistry>
		);
	} );

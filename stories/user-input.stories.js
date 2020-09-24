/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import UserInputApp from '../assets/js/components/user-input/UserInputApp';

storiesOf( 'User Input', module )
	.add( 'User Input Page', () => {
		return <UserInputApp />;
	} );

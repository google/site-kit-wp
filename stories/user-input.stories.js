/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import UserInputApp from '../assets/js/components/user-input/UserInputApp';
import { WithTestRegistry } from '../tests/js/utils';
import { enableFeature } from './utils/features';

storiesOf( 'User Input', module )
	.add( 'UserInputApp', () => {
		enableFeature( 'userInput' );

		return (
			<WithTestRegistry>
				<UserInputApp />
			</WithTestRegistry>
		);
	} );

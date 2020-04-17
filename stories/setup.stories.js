/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import Setup from '../assets/js/components/setup';

storiesOf( 'Setup', module )
	.add( 'Step one', () => {
		global.googlesitekit.setup.isSiteKitConnected = false;
		global.googlesitekit.setup.isAuthenticated = false;
		global.googlesitekit.setup.isVerified = false;
		global.googlesitekit.setup.hasSearchConsoleProperty = false;
		global.googlesitekit.permissions.canSetup = true;
		return ( <Setup /> );
	} );

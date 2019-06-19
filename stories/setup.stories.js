import { storiesOf } from '@storybook/react';
import Setup from 'GoogleComponents/setup';

storiesOf( 'Setup', module )
	.add( 'Client ID', () => {
		googlesitekit.setup.isSiteKitConnected = false;
		googlesitekit.setup.isAuthenticated = false;
		googlesitekit.setup.isVerified = false;
		googlesitekit.setup.hasSearchConsoleProperty = false;
		googlesitekit.permissions.canSetup = true;
		return ( <Setup/> );
	} );

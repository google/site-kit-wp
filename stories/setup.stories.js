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
		global._googlesitekitLegacyData.setup.isSiteKitConnected = false;
		global._googlesitekitLegacyData.setup.isAuthenticated = false;
		global._googlesitekitLegacyData.setup.isVerified = false;
		global._googlesitekitLegacyData.setup.hasSearchConsoleProperty = false;
		global._googlesitekitLegacyData.permissions.canSetup = true;
		return ( <Setup /> );
	} );

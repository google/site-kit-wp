/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
import set from 'lodash/set';

/**
 * Internal dependencies
 */
import SetupUsingGCP from '../assets/js/components/legacy-setup/SetupUsingGCP';
import SetupUsingProxy from '../assets/js/components/setup/SetupUsingProxy';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER, DISCONNECTED_REASON_CONNECTED_URL_MISMATCH } from '../assets/js/googlesitekit/datastore/user/constants';
import { WithTestRegistry } from '../tests/js/utils';

storiesOf( 'Setup / Using GCP', module )
	.add( 'Step one', () => {
		global._googlesitekitLegacyData.setup.isSiteKitConnected = false;
		global._googlesitekitLegacyData.setup.isAuthenticated = false;
		global._googlesitekitLegacyData.setup.isVerified = false;
		global._googlesitekitLegacyData.setup.hasSearchConsoleProperty = false;
		global._googlesitekitLegacyData.permissions.canSetup = true;
		set( global, 'featureFlags.storeErrorNotifications.enabled', false );

		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_USER ).receiveGetAuthentication( {
				authenticated: false,
				requiredScopes: [],
				grantedScopes: [],
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupUsingGCP />
			</WithTestRegistry>
		);
	} );

storiesOf( 'Setup / Using Proxy', module )
	.add( 'Disconnected - URL Mismatch', () => {
		global._googlesitekitLegacyData.setup.isSiteKitConnected = true;
		set( global, 'featureFlags.serviceSetupV2.enabled', false );

		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveGetConnection( {} );
			dispatch( CORE_USER ).receiveGetAuthentication( {
				authenticated: false,
				requiredScopes: [],
				grantedScopes: [],
				disconnectedReason: DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	} );

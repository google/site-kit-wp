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
import { STORE_NAME as CORE_USER, DISCONNECTED_REASON_CONNECTED_URL_MISMATCH } from '../assets/js/googlesitekit/datastore/user/constants';
import { provideUserAuthentication, WithTestRegistry } from '../tests/js/utils';
import { enableFeature } from './utils/features';

storiesOf( 'Setup / Using GCP', module )
	.add( 'Step one', () => {
		global._googlesitekitLegacyData.setup.isSiteKitConnected = false;
		global._googlesitekitLegacyData.setup.isAuthenticated = false;
		global._googlesitekitLegacyData.setup.isVerified = false;
		global._googlesitekitLegacyData.setup.hasSearchConsoleProperty = false;
		global._googlesitekitLegacyData.permissions.canSetup = true;
		enableFeature( 'storeErrorNotifications' );

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
	.add( 'Start', () => {
		return (
			<WithTestRegistry>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	} )
	.add( 'Start [User Input]', () => {
		enableFeature( 'userInput' );
		enableFeature( 'serviceSetupV2' );

		return (
			<WithTestRegistry>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	} )
	.add( 'Disconnected - URL Mismatch', () => {
		const setupRegistry = ( registry ) => {
			provideUserAuthentication( registry, {
				authenticated: false,
				disconnectedReason: DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
			} );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	} )
	.add( 'Disconnected - URL Mismatch [User Input]', () => {
		enableFeature( 'userInput' );
		enableFeature( 'serviceSetupV2' );

		const setupRegistry = ( registry ) => {
			provideUserAuthentication( registry, {
				authenticated: false,
				disconnectedReason: DISCONNECTED_REASON_CONNECTED_URL_MISMATCH,
			} );
		};
		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupUsingProxy />
			</WithTestRegistry>
		);
	} )
;

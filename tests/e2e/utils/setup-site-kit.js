/**
 * WordPress dependencies
 */
import { activatePlugin } from '@wordpress/e2e-test-utils';

/**
 * Internal depedencies
 */
import {
	setSiteVerification,
	setSearchConsoleProperty,
} from '.';

export const setupSiteKit = async ( { verified, property } = {} ) => {
	await activatePlugin( 'e2e-tests-auth-plugin' );
	await setSiteVerification( verified );
	await setSearchConsoleProperty( property );
};

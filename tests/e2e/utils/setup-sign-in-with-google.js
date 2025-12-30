/**
 * Internal dependencies
 */
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '../../../assets/js/modules/sign-in-with-google/constants';
import { wpApiFetch } from './wp-api-fetch';

const defaultSignInWithGoogleSettings = {
	clientID:
		'123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com',
	shape: 'rectangular',
	text: 'signin_with',
	theme: 'outline',
};

/**
 * Activates the Sign in With Google module and completes the setup process.
 *
 * @since 1.125.0
 *
 * @param {Object} settingsOverrides Optional settings to override the defaults.
 */
export async function setupSignInWithGoogle( settingsOverrides = {} ) {
	const settings = {
		...defaultSignInWithGoogleSettings,
		...settingsOverrides,
	};
	// Activate the module.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/core/modules/data/activation',
		data: {
			data: { slug: MODULE_SLUG_SIGN_IN_WITH_GOOGLE, active: true },
		},
	} );
	// Set placeholder connection data.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/modules/sign-in-with-google/data/settings',
		data: {
			data: settings,
		},
	} );
}

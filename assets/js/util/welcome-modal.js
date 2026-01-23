import { getQueryArg } from '@wordpress/url';

export function isInitialWelcomeModalActive() {
	const notification = getQueryArg( location.href, 'notification' );

	// HERE (read notification)
	return notification === 'initial_setup_success';
}

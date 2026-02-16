import { getQueryArg } from '@wordpress/url';

export function isInitialWelcomeModalActive() {
	const notification = getQueryArg( location.href, 'notification' );

	return notification === 'initial_setup_success';
}

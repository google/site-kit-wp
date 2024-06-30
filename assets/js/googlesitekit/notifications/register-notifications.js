import { CORE_MODULES } from '../modules/datastore/constants';

export function registerNotifications( notificationsAPI ) {
	notificationsAPI.registerNotification( 'test-warning-notification', {
		type: 'warning',
		shouldDisplay: ( { select } ) => {
			return select( CORE_MODULES ).isModuleConnected( 'search-console' );
		},
		Component() {
			return <h1>This is a warning</h1>;
		},
		dismissable: true,
	} );

	notificationsAPI.registerNotification( 'test-info-notification', {
		type: 'info',
		shouldDisplay: ( { select } ) => {
			return select( CORE_MODULES ).isModuleConnected( 'search-console' );
		},
		Component() {
			return <h1>This is an info</h1>;
		},
		dismissable: true,
	} );

	notificationsAPI.registerNotification( 'test-error-notification', {
		type: 'error',
		shouldDisplay: ( { select } ) => {
			return select( CORE_MODULES ).isModuleConnected( 'adsense' );
		},
		Component() {
			return <h1>This is an error</h1>;
		},
		dismissable: false,
	} );
}

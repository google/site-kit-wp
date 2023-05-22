import { CORE_MODULES } from '../modules/datastore/constants';

export function registerNotifications( notificationsAPI ) {
	notificationsAPI.registerNotification( 'test-warning-notification', {
		type: 'warning',
		shouldDisplay: ( { select } ) => {
			return select( CORE_MODULES ).isModuleConnected( 'analytics' );
		},
		Component: () => {
			<h1>Hello world</h1>;
		},
	} );

	notificationsAPI.registerNotification( 'test-info-notification', {
		type: 'info',
		shouldDisplay: ( { select } ) => {
			return select( CORE_MODULES ).isModuleConnected( 'search-console' );
		},
		Component: () => {
			<h1>Hello world</h1>;
		},
	} );

	notificationsAPI.registerNotification( 'test-error-notification', {
		type: 'error',
		shouldDisplay: ( { select } ) => {
			return select( CORE_MODULES ).isModuleConnected( 'adsense' );
		},
		Component: () => {
			<h1>Hello world</h1>;
		},
	} );
}

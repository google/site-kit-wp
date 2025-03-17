import setupCTA from './ads-setup-cta';
import accountLinkedViaGoogleForWoocommerce from './account-linked-via-google-for-woocommerce';
import setupSuccessNotificationAds from './setup-success-notification-ads';
import setupSuccessNotificationPAX from './setup-success-notification-pax';

const allNotifications = [
	setupCTA,
	setupSuccessNotificationAds,
	setupSuccessNotificationPAX,
	accountLinkedViaGoogleForWoocommerce,
];

export const registerNotifications = ( notifications ) => {
	for ( const { id, ...settings } in allNotifications ) {
		notifications.registerNotification( id, settings );
	}
};

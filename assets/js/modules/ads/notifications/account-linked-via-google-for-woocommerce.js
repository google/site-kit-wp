import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../googlesitekit/constants';
import { NOTIFICATION_AREAS } from '../../../googlesitekit/notifications/datastore/constants';
import { AccountLinkedViaGoogleForWooCommerceSubtleNotification } from '../components/notifications';
import { MODULES_ADS } from '../datastore/constants';

export default {
	id: 'account-linked-via-google-for-woocommerce',
	Component: AccountLinkedViaGoogleForWooCommerceSubtleNotification,
	priority: 10,
	areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
	viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
	checkRequirements: async ( { select, resolveSelect } ) => {
		// isWooCommerceActivated, isGoogleForWooCommerceActivated and isGoogleForWooCommerceLinked are all relying
		// on the data being resolved in getModuleData() selector.
		await resolveSelect( MODULES_ADS ).getModuleData();

		const {
			isWooCommerceActivated,
			isGoogleForWooCommerceActivated,
			hasGoogleForWooCommerceAdsAccount,
		} = select( MODULES_ADS );

		return (
			isWooCommerceActivated() &&
			isGoogleForWooCommerceActivated() &&
			hasGoogleForWooCommerceAdsAccount()
		);
	},
	featureFlag: 'adsPax',
	isDismissible: true,
};

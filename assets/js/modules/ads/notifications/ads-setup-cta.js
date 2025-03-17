import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../googlesitekit/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '../../../googlesitekit/notifications/datastore/constants';
import { AdsModuleSetupCTABanner } from '../components/notifications';
import { MODULES_ADS } from '../datastore/constants';

export default {
	id: 'ads-setup-cta',
	Component: AdsModuleSetupCTABanner,
	// This notification should be displayed before audience segmentation one,
	// which has priority of 10
	priority: 9,
	areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
	groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
	viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
	checkRequirements: async ( { select, resolveSelect } ) => {
		await Promise.all( [
			// The isPromptDismissed selector relies on the resolution
			// of the getDismissedPrompts() resolver.
			resolveSelect( CORE_USER ).getDismissedPrompts(),
			// isGoogleForWooCommerceLinked is relying
			// on the data being resolved in getModuleData() selector.
			resolveSelect( MODULES_ADS ).getModuleData(),
			resolveSelect( CORE_MODULES ).isModuleConnected( 'ads' ),
			resolveSelect( CORE_MODULES ).canActivateModule( 'ads' ),
		] );

		const { isModuleConnected } = select( CORE_MODULES );
		const { isPromptDismissed } = select( CORE_USER );
		const { hasGoogleForWooCommerceAdsAccount } = select( MODULES_ADS );

		const isAdsConnected = isModuleConnected( 'ads' );
		const isDismissed = isPromptDismissed( 'ads-setup-cta' );

		return (
			isAdsConnected === false &&
			isDismissed === false &&
			hasGoogleForWooCommerceAdsAccount() === false
		);
	},
	isDismissible: true,
	dismissRetries: 1,
	featureFlag: 'adsPax',
};

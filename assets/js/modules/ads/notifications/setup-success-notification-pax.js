import { getQueryArg } from '@wordpress/url';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../googlesitekit/constants';
import { NOTIFICATION_AREAS } from '../../../googlesitekit/notifications/datastore/constants';
import { PAXSetupSuccessSubtleNotification } from '../components/notifications';
import { PAX_SETUP_SUCCESS_NOTIFICATION } from '../pax/constants';

export default {
	id: 'setup-success-notification-pax',
	Component: PAXSetupSuccessSubtleNotification,
	priority: 10,
	areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
	viewContexts: [
		VIEW_CONTEXT_MAIN_DASHBOARD,
		VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	],
	checkRequirements: () => {
		const notification = getQueryArg( location.href, 'notification' );

		if ( PAX_SETUP_SUCCESS_NOTIFICATION === notification ) {
			return true;
		}

		return false;
	},
};

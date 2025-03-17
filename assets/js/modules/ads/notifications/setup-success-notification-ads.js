import { getQueryArg } from '@wordpress/url';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../googlesitekit/constants';
import { NOTIFICATION_AREAS } from '../../../googlesitekit/notifications/datastore/constants';
import { SetupSuccessSubtleNotification } from '../components/notifications';

export default {
	id: 'setup-success-notification-ads',
	Component: SetupSuccessSubtleNotification,
	priority: 10,
	areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
	viewContexts: [
		VIEW_CONTEXT_MAIN_DASHBOARD,
		VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	],
	checkRequirements: () => {
		const notification = getQueryArg( location.href, 'notification' );
		const slug = getQueryArg( location.href, 'slug' );

		if ( 'authentication_success' === notification && slug === 'ads' ) {
			return true;
		}

		return false;
	},
};

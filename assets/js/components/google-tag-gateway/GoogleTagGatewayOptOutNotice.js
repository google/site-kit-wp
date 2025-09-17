/**
 * Google Tag Gateway Opt-Out Notice component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * WordPress dependencies
 */
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { GTG_AUTO_ENABLE_NOTIFICATION } from '@/js/googlesitekit/notifications/constants';
import Notice from '@/js/components/Notice';
import { trackEvent } from '@/js/util';
import useViewContext from '@/js/hooks/useViewContext';
import withIntersectionObserver from '@/js/util/withIntersectionObserver';

export const GTG_OPT_OUT_NOTICE_DISMISSED_ITEM_KEY = 'gtg-opt-out-notice';

const NoticeWithIntersectionObserver = withIntersectionObserver( Notice );

export default function GoogleTagGatewayOptOutNotice() {
	const viewContext = useViewContext();

	const { setIsGTGDefault, saveGoogleTagGatewaySettings } =
		useDispatch( CORE_SITE );
	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );
	const { dismissItem } = useDispatch( CORE_USER );

	const shouldShowNotice = useSelect( ( select ) => {
		const isNoticeDismissed = select( CORE_USER ).isItemDismissed(
			GTG_OPT_OUT_NOTICE_DISMISSED_ITEM_KEY
		);

		const {
			isAnyGoogleTagGatewayModuleConnected: isGTGModuleConnected,
			isGoogleTagGatewayEnabled: isGTGEnabled,
			isGTGDefault,
			isGTGHealthy,
			isScriptAccessEnabled,
		} = select( CORE_SITE );

		return (
			isNoticeDismissed === false &&
			isGTGModuleConnected() === true &&
			isGTGEnabled() === false &&
			isGTGDefault() === true &&
			isGTGHealthy() === true &&
			isScriptAccessEnabled() === true
		);
	} );

	const isAutoEnableNotificationDismissed = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissed(
			GTG_AUTO_ENABLE_NOTIFICATION
		)
	);

	const handleOptOutClick = useCallback( async () => {
		trackEvent( `${ viewContext }_gtg-opt-out-notice`, 'click_opt_out' );

		// Mark settings as no longer default (user has explicitly opted out).
		setIsGTGDefault( false );
		const { error } = await saveGoogleTagGatewaySettings();

		if ( error ) {
			return;
		}

		// Dismiss this notice persistently.
		await dismissItem( GTG_OPT_OUT_NOTICE_DISMISSED_ITEM_KEY );

		// If auto-enable notification is still visible, dismiss it too.
		if ( ! isAutoEnableNotificationDismissed ) {
			dismissNotification( GTG_AUTO_ENABLE_NOTIFICATION );
		}
	}, [
		viewContext,
		setIsGTGDefault,
		saveGoogleTagGatewaySettings,
		dismissItem,
		isAutoEnableNotificationDismissed,
		dismissNotification,
	] );

	if ( ! shouldShowNotice ) {
		return null;
	}

	const description = createInterpolateElement(
		__(
			'Starting in October 2025, Google tag gateway for advertisers will gradually be enabled. <br />You can opt out now before the change happens and it won’t be automatically enabled for you.',
			'google-site-kit'
		),
		{
			br: <br />,
		}
	);

	return (
		<NoticeWithIntersectionObserver
			type={ Notice.TYPES.NEW }
			description={ description }
			dismissButton={ {
				label: __( 'Opt out', 'google-site-kit' ),
				onClick: handleOptOutClick,
			} }
			onInView={ () => {
				trackEvent(
					`${ viewContext }_gtg-opt-out-notice`,
					'view_notice'
				);
			} }
		/>
	);
}

/**
 * AdsConversionIDSettingsNotice component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import Data from 'googlesitekit-data';
import { ADS_CONVERSION_ID_NOTICE_DISMISSED_ITEM_KEY } from '../../constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { DAY_IN_SECONDS, trackEvent } from '../../../../util';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import SettingsNotice, {
	TYPE_INFO,
} from '../../../../components/SettingsNotice';
import InfoCircleIcon from '../../../../../../assets/svg/icons/info-circle.svg';
import Link from '../../../../components/Link';
import useViewContext from '../../../../hooks/useViewContext';
import withIntersectionObserver from '../../../../util/withIntersectionObserver';

const { useSelect } = Data;

const SettingsNoticeWithIntersectionObserver =
	withIntersectionObserver( SettingsNotice );

export default function AdsConversionIDSettingsNotice() {
	const settingsAdminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	const shouldShowNotice = useSelect( ( select ) => {
		const isDismissed = select( CORE_USER ).isItemDismissed(
			ADS_CONVERSION_ID_NOTICE_DISMISSED_ITEM_KEY
		);
		if ( isDismissed ) {
			return false;
		}

		const adsConversionIDMigratedAtMs =
			select( MODULES_ANALYTICS_4 ).getAdsConversionIDMigratedAtMs();
		if ( ! adsConversionIDMigratedAtMs ) {
			return false;
		}

		const now = select( CORE_USER ).getReferenceDate( { parsed: true } );
		return (
			// If it has been <= 28 days since the migration.
			now.getTime() - adsConversionIDMigratedAtMs <=
			28 * DAY_IN_SECONDS * 1000
		);
	} );

	const viewContext = useViewContext();
	const trackDismissNotificationEvent = () => {
		trackEvent(
			`${ viewContext }_GA_Ads_redirect`,
			'dismiss_notification'
		);
	};
	const trackConfirmNotificationEvent = () => {
		trackEvent(
			`${ viewContext }_GA_Ads_redirect`,
			'confirm_notification'
		);
	};

	const onInView = useCallback( () => {
		trackEvent( `${ viewContext }_GA_Ads_redirect`, 'view_notification' );
	}, [ viewContext ] );

	// Do not show the notice if the view conditions have not been met.
	if ( ! shouldShowNotice ) {
		return null;
	}

	return (
		<SettingsNoticeWithIntersectionObserver
			onInView={ onInView }
			className="googlesitekit-settings-analytics-ads-conversion-id-notice"
			dismiss={ ADS_CONVERSION_ID_NOTICE_DISMISSED_ITEM_KEY }
			dismissCallback={ trackDismissNotificationEvent }
			dismissLabel={ __( 'Got it', 'google-site-kit' ) }
			type={ TYPE_INFO }
			Icon={ InfoCircleIcon }
			notice={ createInterpolateElement(
				__(
					'Ads Conversion Tracking ID has been moved to <a>Ads settings</a>',
					'google-site-kit'
				),
				{
					a: (
						<Link
							href={ `${ settingsAdminURL }#/connected-services/ads` }
							onClick={ trackConfirmNotificationEvent }
						/>
					),
				}
			) }
		/>
	);
}

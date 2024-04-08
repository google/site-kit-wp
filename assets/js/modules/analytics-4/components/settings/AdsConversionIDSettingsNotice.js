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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMount } from 'react-use';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ADS_CONVERSION_ID_NOTICE_DISMISSED_ITEM_KEY } from '../../constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { DAY_IN_SECONDS, trackEvent } from '../../../../util';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import SettingsNotice, {
	TYPE_INFO,
} from '../../../../components/SettingsNotice';
import InfoCircleIcon from '../../../../../../assets/svg/icons/info-circle.svg';
import Link from '../../../../components/Link';
import useViewContext from '../../../../hooks/useViewContext';

const { useSelect } = Data;

export default function AdsConversionIDSettingsNotice() {
	const settingsAdminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);
	const adsConversionIDMigratedAtMs = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAdsConversionIDMigratedAtMs()
	);
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

	// Track a view_notification event.
	useMount( () => {
		// Only track the view event if the notice display condition is satisfied.
		// The valid condition is a data migration within the 28 day window.
		if (
			adsConversionIDMigratedAtMs &&
			Date.now() - adsConversionIDMigratedAtMs <
				28 * DAY_IN_SECONDS * 1000
		) {
			trackEvent(
				`${ viewContext }_GA_Ads_redirect`,
				'view_notification'
			);
		}
	} );

	// Do not show the notice if the migration has not been performed yet.
	if ( ! adsConversionIDMigratedAtMs ) {
		return null;
	}

	// If it has been more than 28 days since the migration, do not show
	// the notice.
	if (
		Date.now() - adsConversionIDMigratedAtMs >
		28 * DAY_IN_SECONDS * 1000
	) {
		return null;
	}

	return (
		<SettingsNotice
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
							onClick={ () => trackConfirmNotificationEvent() }
						/>
					),
				}
			) }
		/>
	);
}

/**
 * Ads Conversion ID Settings Notice component.
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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ADS_CONVERSION_ID_NOTICE_DISMISSED_ITEM_KEY } from '../../constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import SettingsNotice, {
	TYPE_INFO,
} from '../../../../components/SettingsNotice';
import InfoCircleIcon from '../../../../../../assets/svg/icons/info-circle.svg';
import Link from '../../../../components/Link';

const { useSelect } = Data;

export default function AdsConversionIDSettingsNotice() {
	const settingsAdminURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	return (
		<SettingsNotice
			className="googlesitekit-settings-analytics-ads-conversion-id-notice"
			dismiss={ ADS_CONVERSION_ID_NOTICE_DISMISSED_ITEM_KEY }
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
						/>
					),
				}
			) }
		/>
	);
}

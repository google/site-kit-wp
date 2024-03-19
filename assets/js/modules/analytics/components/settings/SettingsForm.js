/**
 * Analytics Settings form.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { AdsConversionIDTextField, TrackingExclusionSwitches } from '../common';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import SettingsUACutoffWarning from './SettingsUACutoffWarning';
import GA4SettingsControls from './GA4SettingsControls';
import AdsConversionIDSettingsNotice from '../../../analytics-4/components/settings/AdsConversionIDSettingsNotice';
import EntityOwnershipChangeNotice from '../../../../components/settings/EntityOwnershipChangeNotice';
import { isValidAccountID, isValidPropertyID } from '../../util';
import { useFeature } from '../../../../hooks/useFeature';
const { useSelect } = Data;

export default function SettingsForm( {
	hasAnalyticsAccess,
	hasAnalytics4Access,
} ) {
	const adsModuleEnabled = useFeature( 'adsModule' );

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPropertyID()
	);
	const isUAConnected = isValidPropertyID( propertyID );
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);

	const showTrackingExclusion = isGA4Connected || isUAConnected;

	return (
		<Fragment>
			<SettingsUACutoffWarning />

			<GA4SettingsControls
				hasAnalyticsAccess={ hasAnalyticsAccess }
				hasAnalytics4Access={ hasAnalytics4Access }
			/>

			{ isValidAccountID( accountID ) && (
				<Fragment>
					{ showTrackingExclusion && <TrackingExclusionSwitches /> }
					{ ! adsModuleEnabled && <AdsConversionIDTextField /> }
					{ adsModuleEnabled && <AdsConversionIDSettingsNotice /> }
				</Fragment>
			) }

			{ hasAnalyticsAccess && (
				<EntityOwnershipChangeNotice
					slug={ [ 'analytics', 'analytics-4' ] }
				/>
			) }
		</Fragment>
	);
}

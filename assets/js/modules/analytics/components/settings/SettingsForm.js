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
import {
	AdsConversionIDTextField,
	AnonymizeIPSwitch,
	ExistingGTMPropertyNotice,
	ExistingTagNotice,
	TrackingExclusionSwitches,
} from '../common';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import SettingsControls from './SettingsControls';
import GA4SettingsControls from './GA4SettingsControls';
import { isValidAccountID } from '../../util';
const { useSelect } = Data;

export default function SettingsForm() {
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const useAnalyticsSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getUseSnippet()
	);
	const useTagManagerSnippet = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getUseSnippet()
	);
	const analyticsSinglePropertyID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID()
	);
	const showTrackingExclusion =
		useAnalyticsSnippet ||
		( useTagManagerSnippet && analyticsSinglePropertyID );

	return (
		<Fragment>
			<StoreErrorNotices
				moduleSlug="analytics"
				storeName={ MODULES_ANALYTICS }
			/>
			<ExistingGTMPropertyNotice />
			<ExistingTagNotice />

			<SettingsControls />

			<GA4SettingsControls />

			{ isValidAccountID( accountID ) && (
				<Fragment>
					<AnonymizeIPSwitch />
					{ showTrackingExclusion && <TrackingExclusionSwitches /> }
					<AdsConversionIDTextField />
				</Fragment>
			) }
		</Fragment>
	);
}

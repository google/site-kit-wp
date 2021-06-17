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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	AccountSelect,
	AdsConversionIDTextField,
	AnonymizeIPSwitch,
	ExistingTagNotice,
	ProfileSelect,
	PropertySelect,
	TrackingExclusionSwitches,
	UseSnippetSwitch,
	ProfileNameTextField,
	ExistingGTMPropertyNotice,
	GA4Notice,
	GA4PropertyNotice,
} from '../common';
import GA4PropertySelect from '../../../analytics-4/components/common/PropertySelect';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import {
	SETUP_FLOW_MODE_GA4,
	SETUP_FLOW_MODE_GA4_TRANSITIONAL,
	SETUP_FLOW_MODE_LEGACY,
	SETUP_FLOW_MODE_UA,
	STORE_NAME,
	PROFILE_CREATE,
} from '../../datastore/constants';
import { useFeature } from '../../../../hooks/useFeature';
const { useSelect } = Data;

export default function SettingsForm() {
	const isGA4Enabled = useFeature( 'ga4setup' );
	const setupFlowMode = useSelect( ( select ) => select( STORE_NAME ).getSetupFlowMode() );
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const profileID = useSelect( ( select ) => select( STORE_NAME ).getProfileID() );

	return (
		<div className="googlesitekit-analytics-settings-fields">
			{ SETUP_FLOW_MODE_LEGACY === setupFlowMode && (
				<GA4Notice />
			) }

			<StoreErrorNotices moduleSlug="analytics" storeName={ STORE_NAME } />
			<ExistingTagNotice />
			{ ! hasExistingTag && <ExistingGTMPropertyNotice /> }

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />
				<PropertySelect />
				<ProfileSelect />
			</div>

			{ ( profileID === PROFILE_CREATE ) && (
				<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
					<ProfileNameTextField />
				</div>
			) }

			{ ( isGA4Enabled && ( SETUP_FLOW_MODE_GA4_TRANSITIONAL === setupFlowMode || SETUP_FLOW_MODE_GA4 === setupFlowMode ) ) && (
				<GA4PropertyNotice notice={ __( 'You need to connect the Google Analytics 4 property that’s associated with this Universal Analytics property.', 'google-site-kit' ) }>
					<div className="googlesitekit-setup-module__inputs">
						<GA4PropertySelect />
					</div>
				</GA4PropertyNotice>
			) }

			{ ( isGA4Enabled && SETUP_FLOW_MODE_UA === setupFlowMode ) && (
				<GA4PropertyNotice notice={ __( 'A Google Analytics 4 property will also be created.', 'google-site-kit' ) } />
			) }

			<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
				<UseSnippetSwitch />
				<AnonymizeIPSwitch />
				<TrackingExclusionSwitches />
				<AdsConversionIDTextField />
			</div>
		</div>
	);
}

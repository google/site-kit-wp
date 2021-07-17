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
	UseUASnippetSwitch,
	UseUAandGA4SnippetSwitches,
	ProfileNameTextField,
	ExistingGTMPropertyNotice,
	GA4Notice,
	GA4PropertyNotice,
} from '../common';
import GA4PropertySelect from '../../../analytics-4/components/common/PropertySelect';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { SETUP_FLOW_MODE_LEGACY, STORE_NAME, PROFILE_CREATE } from '../../datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { useFeature } from '../../../../hooks/useFeature';
const { useSelect } = Data;

export default function SettingsForm() {
	const isGA4Enabled = useFeature( 'ga4setup' );
	const isGA4Connected = useSelect( ( select ) => select( CORE_MODULES ).isModuleConnected( 'analytics-4' ) );
	const setupFlowMode = useSelect( ( select ) => select( STORE_NAME ).getSetupFlowMode() );
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const profileID = useSelect( ( select ) => select( STORE_NAME ).getProfileID() );
	const hasExistingGA4Property = useSelect( ( select ) => isGA4Enabled && select( MODULES_ANALYTICS_4 ).getPropertyID() );
	const ga4Properties = useSelect( ( select ) => isGA4Enabled ? select( MODULES_ANALYTICS_4 ).getProperties( accountID ) : null );

	const useAnalyticsSnippet = useSelect( ( select ) => select( STORE_NAME ).getUseSnippet() );
	const useTagManagerSnippet = useSelect( ( select ) => select( MODULES_TAGMANAGER ).getUseSnippet() );
	const analyticsSinglePropertyID = useSelect( ( select ) => select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID() );
	const shouldShowTrackingExclusionSwitches = useAnalyticsSnippet || ( useTagManagerSnippet && analyticsSinglePropertyID );

	const SnippetSwitchComponent = ( isGA4Enabled && hasExistingGA4Property )
		? UseUAandGA4SnippetSwitches
		: UseUASnippetSwitch;

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

			{ ( isGA4Enabled && isGA4Connected && ga4Properties?.length > 0 ) && (
				<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--collapsed">
					<GA4PropertySelect label={ __( 'Google Analytics 4 Property', 'google-site-kit' ) } />
				</div>
			) }

			{ ( isGA4Enabled && isGA4Connected && ga4Properties?.length === 0 ) && (
				<GA4PropertyNotice notice={ __( 'A Google Analytics 4 property will be created.', 'google-site-kit' ) } />
			) }

			<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
				<fieldset>
					<legend className="googlesitekit-setup-module__text">
						{ __( 'Let Site Kit place the Analytics code on your site', 'google-site-kit' ) }
					</legend>
					<SnippetSwitchComponent />
				</fieldset>

				<AnonymizeIPSwitch />
				{ shouldShowTrackingExclusionSwitches && <TrackingExclusionSwitches /> }
				<AdsConversionIDTextField />
			</div>
		</div>
	);
}

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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import {
	AdsConversionIDTextField,
	AnonymizeIPSwitch,
	EnableUniversalAnalytics,
	ExistingGTMPropertyNotice,
	TrackingExclusionSwitches,
} from '../common';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import SettingsUACutoffWarning from './SettingsUACutoffWarning';
import GA4SettingsControls from './GA4SettingsControls';
import EntityOwnershipChangeNotice from '../../../../components/settings/EntityOwnershipChangeNotice';
import { isValidAccountID, isValidPropertyID } from '../../util';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import GA4DashboardViewToggle from './GA4DashboardViewToggle';
import { useFeature } from '../../../../hooks/useFeature';
import SettingsUseSnippetSwitch from './SettingsUseSnippetSwitch';
const { useSelect } = Data;

export default function SettingsForm( {
	hasAnalyticsAccess,
	hasAnalytics4Access,
} ) {
	const ga4ReportingEnabled = useFeature( 'ga4Reporting' );
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
	const useAnalyticsSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getUseSnippet()
	);
	const isTagManagerAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'tagmanager' )
	);
	const useTagManagerSnippet = useSelect(
		( select ) =>
			isTagManagerAvailable &&
			select( MODULES_TAGMANAGER ).getUseSnippet()
	);
	const analyticsSinglePropertyID = useSelect(
		( select ) =>
			isTagManagerAvailable &&
			select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID()
	);
	const showTrackingExclusion =
		useAnalyticsSnippet ||
		( useTagManagerSnippet && analyticsSinglePropertyID );

	const gtmContainersResolved = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).hasFinishedLoadingGTMContainers()
	);

	if ( ! gtmContainersResolved ) {
		return <ProgressBar />;
	}

	return (
		<Fragment>
			<SettingsUACutoffWarning />
			<StoreErrorNotices
				moduleSlug="analytics"
				storeName={ MODULES_ANALYTICS }
			/>
			<ExistingGTMPropertyNotice
				gtmAnalyticsPropertyID={ analyticsSinglePropertyID }
			/>

			{ ga4ReportingEnabled && isUAConnected && (
				<div className="googlesitekit-settings-module__fields-group googlesitekit-settings-module__fields-group--no-border">
					<h4 className="googlesitekit-settings-module__fields-group-title">
						{ __( 'Dashboard view', 'google-site-kit' ) }
					</h4>
					<div className="googlesitekit-settings-module__meta-item googlesitekit-settings-module__meta-item--dashboard-view">
						{ isGA4Connected && <GA4DashboardViewToggle /> }
						{ ! isGA4Connected &&
							__( 'Universal Analytics', 'google-site-kit' ) }
					</div>
				</div>
			) }

			<GA4SettingsControls
				hasAnalyticsAccess={ hasAnalyticsAccess }
				hasAnalytics4Access={ hasAnalytics4Access }
			/>

			{ ga4ReportingEnabled && (
				<EnableUniversalAnalytics>
					<SettingsUseSnippetSwitch />
				</EnableUniversalAnalytics>
			) }

			{ isValidAccountID( accountID ) && (
				<Fragment>
					<AnonymizeIPSwitch />
					{ showTrackingExclusion && <TrackingExclusionSwitches /> }
					<AdsConversionIDTextField />
				</Fragment>
			) }

			{ hasAnalyticsAccess && (
				<EntityOwnershipChangeNotice slug="analytics" />
			) }
		</Fragment>
	);
}

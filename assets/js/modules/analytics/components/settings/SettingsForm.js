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
} from '../common';
import {
	PropertySelect as PropertySelect4,
} from '../../../analytics-4/components/common';
import { isFeatureEnabled } from '../../../../features';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import GA4Notice from '../common/GA4Notice';
import {
	SETUP_FLOW_MODE_GA4_TRANSITIONAL,
	SETUP_FLOW_MODE_LEGACY,
	SETUP_FLOW_MODE_UA,
	STORE_NAME,
} from '../../datastore/constants';
import { MODULES_ANALYTICS_4, PROPERTY_CREATE } from '../../../analytics-4/datastore/constants';
import SettingsNotice, { TYPE_INFO } from '../../../../components/SettingsNotice';
import Link from '../../../../components/Link';
const { useSelect, useDispatch } = Data;

export default function SettingsForm() {
	const ga4Enabled = isFeatureEnabled( 'ga4setup' );
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const { selectProperty } = useDispatch( MODULES_ANALYTICS_4 );
	useSelect( ( select ) => {
		// We need to call getProperties for getSetupFlowMode to work.
		const accountID = select( STORE_NAME ).getAccountID();
		return select( MODULES_ANALYTICS_4 ).getProperties( accountID );
	} );
	// @TODO remove these, only for dev purposes
	// const setupFlowMode = SETUP_FLOW_MODE_UA;
	// const setupFlowMode = SETUP_FLOW_MODE_GA4_TRANSITIONAL
	// const setupFlowMode = SETUP_FLOW_MODE_GA4_TRANSITIONAL;
	const setupFlowMode = useSelect( ( select ) => select( STORE_NAME ).getSetupFlowMode() );
	if ( ga4Enabled && SETUP_FLOW_MODE_UA === setupFlowMode ) {
		selectProperty( PROPERTY_CREATE );
	}

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
			{
				ga4Enabled && SETUP_FLOW_MODE_GA4_TRANSITIONAL === setupFlowMode && (
					<SettingsNotice type={ TYPE_INFO }>
						<div>
							{ __( 'You\'ll need to connect the Google Analytics 4 property that\'s associated with this Universal Analytics property', 'google-site-kit' ) }
						</div>
						<div>
							<PropertySelect4 />
						</div>
						<Link
							href="https://sitekit.withgoogle.com/documentation/ga4-analytics-property/"
							external
							inherit
						>
							{ __( 'Learn more here.', 'google-site-kit' ) }
						</Link>
					</SettingsNotice>
				)
			}
			{
				ga4Enabled && SETUP_FLOW_MODE_UA === setupFlowMode && (
					<SettingsNotice type={ TYPE_INFO }>
						{ __( 'A Google Analytics 4 property will also be created.', 'google-site-kit' ) }
						<Link
							href="https://sitekit.withgoogle.com/documentation/ga4-analytics-property/"
							external
							inherit
						>
							{ __( 'Learn more here.', 'google-site-kit' ) }
						</Link>
					</SettingsNotice>
				)
			}
			<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
				<ProfileNameTextField />

				<UseSnippetSwitch />

				<AnonymizeIPSwitch />

				<TrackingExclusionSwitches />

				<AdsConversionIDTextField />
			</div>
		</div>
	);
}

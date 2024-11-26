/**
 * Analytics 4 Settings form.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { TrackingExclusionSwitches } from '../common';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import SettingsControls from './SettingsControls';
import AdsConversionIDSettingsNotice from './AdsConversionIDSettingsNotice';
import EntityOwnershipChangeNotice from '../../../../components/settings/EntityOwnershipChangeNotice';
import { isValidAccountID } from '../../utils/validation';
import ConversionTrackingToggle from '../../../../components/conversion-tracking/ConversionTrackingToggle';
import SettingsGroup from '../../../../components/settings/SettingsGroup';
import SettingsEnhancedMeasurementSwitch from './SettingsEnhancedMeasurementSwitch';
import SupportLink from '../../../../components/SupportLink';

export default function SettingsForm( { hasModuleAccess } ) {
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountID()
	);

	return (
		<Fragment>
			<SettingsControls hasModuleAccess={ hasModuleAccess } />

			{ isValidAccountID( accountID ) && <TrackingExclusionSwitches /> }

			{ hasModuleAccess && (
				<EntityOwnershipChangeNotice slug={ [ 'analytics-4' ] } />
			) }

			<SettingsGroup
				title={ __( 'Improve your measurement', 'google-site-kit' ) }
			>
				<SettingsEnhancedMeasurementSwitch
					hasModuleAccess={ hasModuleAccess }
					hideDescription
					label={ createInterpolateElement(
						__(
							'<div><span>Enhanced measurement is enabled for this web data stream</span><span>This allows you to measure interactions with your content (e.g. file downloads, form completions, video views). <a>Learn more</a></span></div>',
							'google-site-kit'
						),
						{
							a: (
								<SupportLink
									path="/analytics/answer/9216061"
									external
								/>
							),
							span: <span />,
							div: (
								<div className="googlesitekit-settings-enhanced-measurement-enabled-info" />
							),
						}
					) }
				/>
				<ConversionTrackingToggle>
					{ createInterpolateElement(
						__(
							'To track the performance of your campaigns, Site Kit will enable enhanced conversion tracking. <a>Learn more</a>',
							'google-site-kit'
						),
						{
							a: (
								<SupportLink
									path="/analytics/answer/9216061"
									external
								/>
							),
						}
					) }
				</ConversionTrackingToggle>
			</SettingsGroup>

			{ isValidAccountID( accountID ) && (
				<AdsConversionIDSettingsNotice />
			) }
		</Fragment>
	);
}

SettingsForm.propTypes = {
	hasModuleAccess: PropTypes.bool,
};

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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { AdsConversionIDTextField, TrackingExclusionSwitches } from '../common';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import GA4SettingsControls from './GA4SettingsControls';
import EntityOwnershipChangeNotice from '../../../../components/settings/EntityOwnershipChangeNotice';
import { isValidAccountID } from '../../utils/validation';
const { useSelect } = Data;

export default function SettingsForm( { hasAnalytics4Access } ) {
	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountID()
	);

	return (
		<Fragment>
			<GA4SettingsControls hasAnalytics4Access={ hasAnalytics4Access } />

			{ isValidAccountID( accountID ) && (
				<Fragment>
					{ isGA4Connected && <TrackingExclusionSwitches /> }
					<AdsConversionIDTextField />
				</Fragment>
			) }

			{ hasAnalytics4Access && (
				<EntityOwnershipChangeNotice slug={ [ 'analytics-4' ] } />
			) }
		</Fragment>
	);
}

SettingsForm.propTypes = {
	hasAnalytics4Access: PropTypes.bool,
};

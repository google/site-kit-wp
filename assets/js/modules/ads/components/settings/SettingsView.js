/**
 * Ads Settings View component
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
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ADS } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import DisplaySetting from '../../../../components/DisplaySetting';
import AdBlockerWarning from '../common/AdBlockerWarning';
const { useSelect } = Data;

export default function SettingsView() {
	const conversionID = useSelect( ( select ) =>
		select( MODULES_ADS ).getConversionID()
	);

	const paxConversionID = useSelect( ( select ) =>
		select( MODULES_ADS ).getPaxConversionID()
	);

	const extCustomerID = useSelect( ( select ) =>
		select( MODULES_ADS ).getExtCustomerID()
	);

	const isAdBlockerActive = useSelect( ( select ) =>
		select( CORE_USER ).isAdBlockerActive()
	);

	return (
		<Fragment>
			<AdBlockerWarning />
			{ ! isAdBlockerActive && ! paxConversionID && ! extCustomerID && (
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Conversion Tracking ID', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ conversionID ? (
							<DisplaySetting value={ conversionID } />
						) : (
							__( 'None', 'google-site-kit' )
						) }
					</p>
				</div>
			) }

			{ ! isAdBlockerActive && ! conversionID && (
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Conversion Tracking ID', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ paxConversionID ? (
							<DisplaySetting value={ paxConversionID } />
						) : (
							__( 'None', 'google-site-kit' )
						) }
					</p>
				</div>
			) }

			{ ! isAdBlockerActive && ! conversionID && (
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Customer ID', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ extCustomerID ? (
							<DisplaySetting value={ extCustomerID } />
						) : (
							__( 'None', 'google-site-kit' )
						) }
					</p>
				</div>
			) }
		</Fragment>
	);
}

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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ADS } from '../../datastore/constants';
import DisplaySetting from '../../../../components/DisplaySetting';
const { useSelect } = Data;

export default function SettingsView() {
	const conversionID = useSelect( ( select ) =>
		select( MODULES_ADS ).getConversionID()
	);

	return (
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
	);
}

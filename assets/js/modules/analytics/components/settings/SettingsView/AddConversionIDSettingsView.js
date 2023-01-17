/**
 * Add Conversion ID Settings View component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import DisplaySetting from '../../../../../components/DisplaySetting';
import { MODULES_ANALYTICS } from '../../../datastore/constants';
const { useSelect } = Data;

export default function AddConversionIDSettingsView() {
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getUseSnippet()
	);
	const canUseSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getCanUseSnippet()
	);
	const adsConversionID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAdsConversionID()
	);

	if ( ! canUseSnippet ) {
		return null;
	}

	if ( ! useSnippet ) {
		return null;
	}

	return (
		<div className="googlesitekit-settings-module__meta-items">
			<div className="googlesitekit-settings-module__meta-item">
				<h5 className="googlesitekit-settings-module__meta-item-type">
					{ __( 'Ads Conversion ID', 'google-site-kit' ) }
				</h5>
				<p className="googlesitekit-settings-module__meta-item-data">
					{ adsConversionID ? (
						<DisplaySetting value={ adsConversionID } />
					) : (
						__( 'None', 'google-site-kit' )
					) }
				</p>
			</div>
		</div>
	);
}

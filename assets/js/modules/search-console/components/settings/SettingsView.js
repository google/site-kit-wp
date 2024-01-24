/**
 * Search Console Settings View component
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
import { MODULES_SEARCH_CONSOLE } from '../../datastore/constants';
import DisplaySetting from '../../../../components/DisplaySetting';
const { useSelect } = Data;

export default function SettingsView() {
	const propertyID = useSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).getPropertyID()
	);

	return (
		<div className="googlesitekit-settings-module__meta-item">
			<h5 className="googlesitekit-settings-module__meta-item-type">
				{ __( 'Connected Property', 'google-site-kit' ) }
			</h5>
			<p className="googlesitekit-settings-module__meta-item-data">
				<DisplaySetting value={ propertyID } />
			</p>
		</div>
	);
}

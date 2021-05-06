/**
 * Search Console Settings Edit component.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import ProgressBar from '../../../../components/ProgressBar';
import SettingsForm from './SettingsForm';
const { useSelect } = Data;

export default function SettingsEdit() {
	// We need this useSelect hook to trigger starting getMatchedProperties resolution which is needed to properly
	// display the progress bar while matched properties are being loaded.
	useSelect( ( select ) => select( STORE_NAME ).getMatchedProperties() );

	const isDoingSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).isDoingSubmitChanges() );
	const hasResolvedProperties = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getMatchedProperties' ) );

	let viewComponent;
	if ( isDoingSubmitChanges || ! hasResolvedProperties ) {
		viewComponent = <ProgressBar />;
	} else {
		viewComponent = <SettingsForm />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--search-console">
			{ viewComponent }
		</div>
	);
}

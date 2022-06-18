/**
 * Thank with Google Settings Edit component.
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
import ProgressBar from '../../../../components/ProgressBar';
import { MODULES_THANK_WITH_GOOGLE } from '../../datastore/constants';
import SettingsForm from './SettingsForm';
const { useSelect } = Data;

export default function SettingsEdit() {
	const isLoading = useSelect(
		( select ) =>
			select( MODULES_THANK_WITH_GOOGLE ).getProducts() === undefined &&
			select( MODULES_THANK_WITH_GOOGLE ).getPublicationID() ===
				undefined &&
			select( MODULES_THANK_WITH_GOOGLE ).getRevenueModel() === undefined
	);

	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).isDoingSubmitChanges()
	);

	let viewComponent;
	if ( isLoading || isDoingSubmitChanges ) {
		viewComponent = <ProgressBar />;
	} else {
		viewComponent = <SettingsForm />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--thank-with-google">
			{ viewComponent }
		</div>
	);
}

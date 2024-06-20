/**
 * Ads Settings Edit component.
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
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { MODULES_ADS } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import SettingsForm from './SettingsForm';
import AdBlockerWarning from '../../../../components/notifications/AdBlockerWarning';

export default function SettingsEdit() {
	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ADS ).isDoingSubmitChanges()
	);

	const isAdBlockerActive = useSelect( ( select ) =>
		select( CORE_USER ).isAdBlockerActive()
	);

	let viewComponent;
	if ( isAdBlockerActive ) {
		viewComponent = <AdBlockerWarning moduleSlug="ads" />;
	} else if ( isDoingSubmitChanges ) {
		viewComponent = <ProgressBar />;
	} else {
		viewComponent = <SettingsForm />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--ads">
			{ viewComponent }
		</div>
	);
}

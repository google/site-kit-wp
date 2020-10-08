/**
 * Tag Manager Settings Form component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import {
	AccountSelect,
	AMPContainerNameTextField,
	AMPContainerSelect,
	FormInstructions,
	UseSnippetSwitch,
	WebContainerNameTextField,
	WebContainerSelect,
} from '../common';
import StoreErrorNotice from '../../../../components/StoreErrorNotice';
import { CONTAINER_CREATE, STORE_NAME } from '../../datastore/constants';
const { useSelect } = Data;

export default function SettingsForm() {
	const containerID = useSelect( ( select ) => select( STORE_NAME ).getContainerID() );
	const ampContainerID = useSelect( ( select ) => select( STORE_NAME ).getAMPContainerID() );

	let containerNames = null;
	if ( containerID === CONTAINER_CREATE || ampContainerID === CONTAINER_CREATE ) {
		const webContainerName = containerID === CONTAINER_CREATE
			? <WebContainerNameTextField />
			: null;

		const ampContainerName = ampContainerID === CONTAINER_CREATE
			? <AMPContainerNameTextField />
			: null;

		containerNames = (
			<div className="googlesitekit-setup-module__inputs">
				{ webContainerName }
				{ ampContainerName }
			</div>
		);
	}

	return (
		<div className="googlesitekit-tagmanager-settings-fields">
			<StoreErrorNotice moduleSlug="tagmanager" storeName={ STORE_NAME } />
			<FormInstructions />

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />

				<WebContainerSelect />

				<AMPContainerSelect />
			</div>

			{ containerNames }

			<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
				<UseSnippetSwitch />
			</div>
		</div>
	);
}

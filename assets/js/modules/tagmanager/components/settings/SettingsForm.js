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
import {
	AccountSelect,
	AMPContainerSelect,
	FormInstructions,
	UseSnippetSwitch,
	WebContainerSelect,
} from '../common';
import StoreErrorNotice from '../../../../components/StoreErrorNotice';
import { STORE_NAME } from '../../datastore/constants';

export default function SettingsForm() {
	return (
		<div className="googlesitekit-tagmanager-settings-fields">
			<StoreErrorNotice moduleSlug="tagmanager" storeName={ STORE_NAME } />
			<FormInstructions />

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />

				<WebContainerSelect />

				<AMPContainerSelect />
			</div>

			<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
				<UseSnippetSwitch />
			</div>
		</div>
	);
}

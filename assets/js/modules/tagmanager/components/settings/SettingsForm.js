/**
 * Tag Manager Settings Form component.
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
import {
	AccountSelect,
	AMPContainerSelect,
	ContainerNames,
	FormInstructions,
	UseSnippetSwitch,
	WebContainerSelect,
} from '../common';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { MODULES_TAGMANAGER } from '../../datastore/constants';
import ProgressBar from '../../../../components/ProgressBar';
const { useSelect } = Data;

export default function SettingsForm() {
	const accountID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getAccountID()
	);
	const internalContainerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getInternalContainerID()
	);
	const internalAMPContainerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getInternalAMPContainerID()
	);
	const isResolvingWebGetLiveContainerVersion = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).isResolving( 'getLiveContainerVersion', [
			accountID,
			internalContainerID,
		] )
	);
	const isResolvingAMPGetLiveContainerVersion = useSelect(
		( select ) =>
			select( MODULES_TAGMANAGER ).isResolving(
				'getLiveContainerVersion'
			),
		[ accountID, internalAMPContainerID ]
	);

	return (
		<div className="googlesitekit-tagmanager-settings-fields">
			<StoreErrorNotices
				moduleSlug="tagmanager"
				storeName={ MODULES_TAGMANAGER }
			/>
			<FormInstructions />

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />

				<WebContainerSelect />

				<AMPContainerSelect />

				{ isResolvingWebGetLiveContainerVersion ||
				isResolvingAMPGetLiveContainerVersion ? (
					<div className="googlesitekit-margin-left-1rem googlesitekit-align-self-center">
						<small>
							{ __( 'Checking tags…', 'google-site-kit' ) }
						</small>
						<ProgressBar small compress />
					</div>
				) : null }
			</div>

			<ContainerNames />

			<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
				<UseSnippetSwitch />
			</div>
		</div>
	);
}

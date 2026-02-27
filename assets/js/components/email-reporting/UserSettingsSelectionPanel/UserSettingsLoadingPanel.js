/**
 * User Settings Loading Panel
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PreviewBlock from '@/js/components/PreviewBlock';
import { SelectionPanelHeader } from '@/js/components/SelectionPanel';
import PreviewBlocks from '@/js/components/PreviewBlocks';

export default function UserSettingsLoadingPanel() {
	return (
		<Fragment>
			<SelectionPanelHeader
				title={ __( 'Email reports subscription', 'google-site-kit' ) }
			>
				<PreviewBlock width="100%" height="16px" />
				<br />
			</SelectionPanelHeader>
			<div className="googlesitekit-user-settings-selection__panel-content">
				<div className="googlesitekit-user-settings-selection__panel-description">
					<PreviewBlock width="100%" height="16px" />
					<PreviewBlock width="60%" height="16px" />
				</div>

				<br />
				<PreviewBlock width="20%" height="16px" />
				<br />

				<div className="googlesitekit-frequency-selector">
					<PreviewBlocks width="100%" height="184px" count={ 3 } />
				</div>
				<div className="googlesitekit-selection-panel-subscribe-actions">
					<PreviewBlocks width="140px" height="42px" count={ 2 } />
				</div>
			</div>
		</Fragment>
	);
}

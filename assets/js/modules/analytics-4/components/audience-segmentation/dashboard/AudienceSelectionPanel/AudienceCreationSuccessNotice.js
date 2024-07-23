/**
 * Audience Creation Success Notice component.
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
import { Button } from 'googlesitekit-components';
import CheckFill from '../../../../../../../svg/icons/check-fill.svg';

export default function AudienceCreationSuccessNotice() {
	return (
		<div className="googlesitekit-audience-selection-panel__success-notice">
			<div className="googlesitekit-audience-selection-panel__success-notice-icon">
				<CheckFill width={ 24 } height={ 24 } />
			</div>
			<p className="googlesitekit-audience-selection-panel__success-notice-message">
				{ __(
					'Visitor group created successfully!',
					'google-site-kit'
				) }
			</p>
			<div className="googlesitekit-audience-selection-panel__success-notice-actions">
				<Button tertiary>{ __( 'Got it', 'google-site-kit' ) }</Button>
			</div>
		</div>
	);
}

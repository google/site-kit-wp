/**
 * WelcomeModal component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { Dialog, DialogContent } from '@/js/material-components';

export default function WelcomeModal() {
	return (
		<Dialog
			onClose={ () => {} }
			className="googlesitekit-dialog googlesitekit-welcome-modal"
			open
		>
			<DialogContent className="googlesitekit-dialog__content">
				<div className="googlesitekit-welcome-modal__content">
					<h1 className="googlesitekit-welcome-modal__title">
						{ __( 'Welcome to Site Kit', 'google-site-kit' ) }
					</h1>
				</div>
			</DialogContent>
		</Dialog>
	);
}

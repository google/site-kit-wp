/**
 * WooCommerce Redirect Modal component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
	SpinnerButton,
} from 'googlesitekit-components';

export default function WooCommerceRedirectModal( {
	dialogActive,
	onDismiss,
} ) {
	return (
		<Dialog
			open={ dialogActive }
			aria-describedby={ undefined }
			tabIndex="-1"
			className="googlesitekit-dialog-confirm-site-purpose-change"
			onClose={ onDismiss }
		>
			<DialogTitle>
				{ __( 'Using the WooCommerce plugin?', 'google-site-kit' ) }
			</DialogTitle>
			<DialogContent>
				<p>
					{ __(
						'The Google for WooCommerce plugin can utilize your provided business information for advertising on Google and may be more suitable for your business.',
						'google-site-kit'
					) }
				</p>
			</DialogContent>
			<DialogFooter>
				<Button className="mdc-dialog__cancel-button" tertiary>
					{ __( 'Continue with Site Kit', 'google-site-kit' ) }
				</Button>
				<SpinnerButton>
					{ __( 'Use Google for WooCommerce', 'google-site-kit' ) }
				</SpinnerButton>
			</DialogFooter>
		</Dialog>
	);
}

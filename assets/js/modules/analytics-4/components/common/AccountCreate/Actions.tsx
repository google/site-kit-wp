/**
 * AccountCreate Actions component.
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
 * External dependencies
 */
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button as RawButton } from 'googlesitekit-components';

// The `Button` component from `googlesitekit-components` is not fully typed yet.
// Cast to an `FC` with the props we use here so this file can be type-checked.
const Button = RawButton as FC< {
	className?: string;
	disabled?: boolean;
	onClick?: () => void;
	tertiary?: boolean;
} >;

export interface ActionsProps {
	canSubmitAccountCreate?: boolean;
	onCreateAccount: () => void;
	accounts?: unknown[] | null;
	onBack: () => void;
	hasAccountCreationError?: boolean;
	isInitialSetupFlow?: boolean;
	onContinueWithoutAnalytics: () => void;
}

const Actions: FC< ActionsProps > = ( {
	canSubmitAccountCreate,
	onCreateAccount,
	accounts,
	onBack,
	hasAccountCreationError,
	isInitialSetupFlow,
	onContinueWithoutAnalytics,
} ) => {
	return (
		<div className="googlesitekit-setup-module__action">
			<Button
				disabled={ ! canSubmitAccountCreate }
				onClick={ onCreateAccount }
			>
				{ __( 'Create Account', 'google-site-kit' ) }
			</Button>

			{ accounts && !! accounts.length && (
				<Button
					className="googlesitekit-setup-module__sub-action"
					onClick={ onBack }
					tertiary
				>
					{ __( 'Back', 'google-site-kit' ) }
				</Button>
			) }

			{ hasAccountCreationError && isInitialSetupFlow && (
				<Button
					className="googlesitekit-setup-module__sub-action"
					onClick={ onContinueWithoutAnalytics }
					tertiary
				>
					{ __( 'Continue without Analytics', 'google-site-kit' ) }
				</Button>
			) }
		</div>
	);
};

export default Actions;

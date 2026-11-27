/**
 * Reader Revenue Manager express setup step actions.
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
import classnames from 'classnames';
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';

interface ExpressSetupStepActionsProps {
	canGoForward?: boolean;
	isBusy: boolean;
	isSticky?: boolean;
	label: string;
	onGoBack?: () => void;
}

const ExpressSetupStepActions: FC< ExpressSetupStepActionsProps > = ( {
	canGoForward = true,
	isBusy,
	isSticky = false,
	label,
	onGoBack,
} ) => (
	<div
		className={ classnames(
			'googlesitekit-rrm-express-setup-step-actions',
			{
				'googlesitekit-rrm-express-setup-step-actions--sticky':
					isSticky,
			}
		) }
	>
		{ /* @ts-expect-error - The `SpinnerButton` component is not typed yet. */ }
		<SpinnerButton
			disabled={ isBusy || ! canGoForward }
			isSaving={ isBusy }
			type="submit"
		>
			{ label }
		</SpinnerButton>

		{ onGoBack ? (
			/* @ts-expect-error - The `Button` component is not typed yet. */
			<Button
				disabled={ isBusy }
				onClick={ onGoBack }
				type="button"
				tertiary
			>
				{ __( 'Back', 'google-site-kit' ) }
			</Button>
		) : null }
	</div>
);

export default ExpressSetupStepActions;

/**
 * ActivateAnalyticsCTA error state content.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_LABEL } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';

type ErrorCTAContentProps = {
	handleActivationErrorDismiss: () => void;
	handleActivationRetry: () => void;
	inProgress: boolean;
};

const ErrorCTAContent = forwardRef< HTMLDivElement, ErrorCTAContentProps >(
	(
		{ handleActivationErrorDismiss, handleActivationRetry, inProgress },
		ref
	) => (
		<div
			ref={ ref }
			className="googlesitekit-activate-analytics-cta googlesitekit-activate-analytics-cta--error"
		>
			<div>
				<Typography
					type={ TYPE_LABEL }
					size={ SIZE_MEDIUM }
					as="h2"
					className="googlesitekit-activate-analytics-cta__title"
				>
					{ __( 'Analytics setup failed', 'google-site-kit' ) }
				</Typography>
				{ /* @ts-expect-error `P` component type currently requires `size` prop. */ }
				<P className="googlesitekit-activate-analytics-cta__description">
					{ __(
						'Something went wrong, please try again',
						'google-site-kit'
					) }
				</P>
			</div>
			<div className="googlesitekit-activate-analytics-cta__actions">
				{ /* @ts-expect-error `Button` component is not yet typed. */ }
				<Button
					className="googlesitekit-activate-analytics-cta__button--secondary googlesitekit-activate-analytics-cta__dismiss-button--error"
					onClick={ handleActivationErrorDismiss }
					tertiary
				>
					{ __( 'Got it', 'google-site-kit' ) }
				</Button>
				{ /* @ts-expect-error `SpinnerButton` component type does not include children yet. */ }
				<SpinnerButton
					className="googlesitekit-activate-analytics-cta__button--primary"
					onClick={ handleActivationRetry }
					isSaving={ inProgress }
					disabled={ inProgress }
				>
					{ __( 'Retry Analytics setup', 'google-site-kit' ) }
				</SpinnerButton>
			</div>
		</div>
	)
);

ErrorCTAContent.displayName = 'ErrorCTAContent';

ErrorCTAContent.propTypes = {
	handleActivationErrorDismiss: PropTypes.func.isRequired,
	handleActivationRetry: PropTypes.func.isRequired,
	inProgress: PropTypes.bool.isRequired,
};

export default ErrorCTAContent;

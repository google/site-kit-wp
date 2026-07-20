/**
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
import { MouseEvent } from 'react';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';
import ExternalIcon from '@/svg/icons/external.svg';

// eslint-disable-next-line sitekit/acronym-case
export interface CTAButtonProps {
	ariaLabel?: string;
	disabled?: boolean;
	dismissOnClick?: boolean;
	dismissOptions?: {
		expiresInSeconds: number;
		skipHidingFromQueue: boolean;
	};
	external?: boolean;
	hideExternalIndicator?: boolean;
	href?: string;
	inProgress?: boolean;
	label?: string;
	onClick?: (
		event: MouseEvent< HTMLAnchorElement | HTMLButtonElement >
	) => void;
}

export default function Button(
	{
		ariaLabel,
		disabled = false,
		external = false,
		hideExternalIndicator = false,
		href,
		inProgress = false,
		label,
		onClick = () => {},
	}: CTAButtonProps /* eslint-disable-line sitekit/acronym-case */
) {
	if ( ! label || ( ! onClick && ! href ) ) {
		return null;
	}

	let trailingIconToUse;
	if ( external && ! hideExternalIndicator ) {
		trailingIconToUse = <ExternalIcon width={ 14 } height={ 14 } />;
	}

	return (
		// @ts-expect-error `SpinnerButton` component is not yet typed.
		<SpinnerButton
			className="googlesitekit-banner__cta"
			aria-label={ ariaLabel }
			disabled={ disabled || inProgress }
			isSaving={ inProgress }
			onClick={ onClick }
			href={ href }
			target={ external ? '_blank' : undefined }
			trailingIcon={ trailingIconToUse }
		>
			{ label }
		</SpinnerButton>
	);
}

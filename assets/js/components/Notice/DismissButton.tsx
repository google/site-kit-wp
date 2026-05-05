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
import classnames from 'classnames';
import type { FC, MouseEvent, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';

export interface DismissButtonProps {
	label?: string;
	dismissOptions?: {
		expiresInSeconds?: number;
		skipHidingFromQueue?: boolean;
	};
	onClick?: (
		event: MouseEvent< HTMLAnchorElement | HTMLButtonElement >
	) => void;
	disabled?: boolean;
	href?: string;
	external?: boolean;
	variant?: 'text' | 'icon';
	icon?: ReactNode;
	ariaLabel?: string;
}

const DismissButton: FC< DismissButtonProps > = ( {
	label = __( 'Got it', 'google-site-kit' ),
	onClick,
	disabled,
	href,
	external = false,
	variant = 'text',
	icon,
	ariaLabel,
} ) => {
	return (
		// @ts-expect-error - `Button` component typing is incomplete.
		<Button
			className={ classnames( {
				'googlesitekit-notice__dismiss': variant === 'icon',
				'googlesitekit-notice__dismiss--icon': variant === 'icon',
			} ) }
			onClick={ onClick }
			disabled={ disabled }
			href={ href }
			target={ external ? '_blank' : undefined }
			tertiary={ variant !== 'icon' }
			icon={ variant === 'icon' ? icon : undefined }
			aria-label={ variant === 'icon' ? ariaLabel : undefined }
			hideTooltipTitle={ variant === 'icon' }
		>
			{ variant !== 'icon' ? label : undefined }
		</Button>
	);
};

export default DismissButton;

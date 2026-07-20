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
import { MouseEvent, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';

export interface DismissButtonProps {
	className?: string;
	disabled?: boolean;
	label?: ReactNode;
	onClick?: (
		event: MouseEvent< HTMLAnchorElement | HTMLButtonElement >
	) => void;
	tertiary?: boolean;
}

export default function DismissButton( {
	className,
	label = String( __( 'Maybe later', 'google-site-kit' ) ),
	onClick,
	disabled,
	tertiary = true,
}: DismissButtonProps ) {
	if ( ! onClick ) {
		return null;
	}

	return (
		// @ts-expect-error `Button` component is not yet typed.
		<Button
			className={ className }
			onClick={ onClick }
			disabled={ disabled }
			tertiary={ tertiary }
		>
			{ label }
		</Button>
	);
}

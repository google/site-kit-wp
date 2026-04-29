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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';

export default function DismissButton( {
	label = __( 'Got it', 'google-site-kit' ),
	onClick,
	disabled,
	href,
	external = false,
	variant = 'text',
	icon,
	ariaLabel,
} ) {
	if ( variant === 'icon' ) {
		return (
			<Button
				className="googlesitekit-notice__dismiss googlesitekit-notice__dismiss--icon"
				onClick={ onClick }
				disabled={ disabled }
				href={ href }
				target={ external ? '_blank' : undefined }
				icon={ icon }
				aria-label={ ariaLabel }
				hideTooltipTitle
			/>
		);
	}

	return (
		<Button
			onClick={ onClick }
			disabled={ disabled }
			href={ href }
			target={ external ? '_blank' : undefined }
			tertiary
		>
			{ label }
		</Button>
	);
}

DismissButton.propTypes = {
	label: PropTypes.string,
	onClick: PropTypes.func,
	disabled: PropTypes.bool,
	href: PropTypes.string,
	external: PropTypes.bool,
	variant: PropTypes.oneOf( [ 'text', 'icon' ] ),
	icon: PropTypes.node,
	ariaLabel: PropTypes.string,
};

/**
 * SubtleNotification component.
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
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import CheckFillSVG from '../../../svg/icons/check-fill.svg';
import ExternalSVG from '../../../svg/icons/external.svg';
import WarningSVG from '../../../svg/icons/warning.svg';

export const VARIANTS = {
	SUCCESS: 'success',
	WARNING: 'warning',
};

function SubtleNotification( {
	title,
	description,
	Icon,
	ctaLink,
	ctaLabel,
	className,
	onCTAClick,
	isCTALinkExternal,
	isDismissible = true,
	dismissLabel = __( 'Ok, got it', 'google-site-kit' ),
	onDismiss = () => {},
	variant = VARIANTS.SUCCESS,
	hideIcon = false,
} ) {
	return (
		<div
			className={ classnames(
				'googlesitekit-subtle-notification',
				{
					'googlesitekit-subtle-notification--success':
						variant === VARIANTS.SUCCESS,
					'googlesitekit-subtle-notification--warning':
						variant === VARIANTS.WARNING,
				},
				className
			) }
		>
			{ ! hideIcon && (
				<div className="googlesitekit-subtle-notification__icon">
					{ Icon && <Icon width={ 24 } height={ 24 } /> }
					{ ! Icon && variant === VARIANTS.SUCCESS && (
						<CheckFillSVG width={ 24 } height={ 24 } />
					) }
					{ ! Icon && variant === VARIANTS.WARNING && (
						<WarningSVG width={ 24 } height={ 24 } />
					) }
				</div>
			) }
			<div className="googlesitekit-subtle-notification__content">
				<p>{ title }</p>
				{ description && (
					<p className="googlesitekit-subtle-notification__secondary_description">
						{ description }
					</p>
				) }
			</div>
			<div className="googlesitekit-subtle-notification__action">
				{ isDismissible && (
					<Button tertiary onClick={ onDismiss }>
						{ dismissLabel }
					</Button>
				) }
				{ ctaLabel && (
					<Button
						className="googlesitekit-subtle-notification__cta"
						href={ ctaLink }
						onClick={ onCTAClick }
						target={ isCTALinkExternal ? '_blank' : '_self' }
						trailingIcon={
							isCTALinkExternal ? (
								<ExternalSVG width={ 14 } height={ 14 } />
							) : undefined
						}
					>
						{ ctaLabel }
					</Button>
				) }
			</div>
		</div>
	);
}

SubtleNotification.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string,
	Icon: PropTypes.elementType,
	ctaLink: PropTypes.string,
	ctaLabel: PropTypes.string,
	className: PropTypes.string,
	onCTAClick: PropTypes.func,
	isCTALinkExternal: PropTypes.bool,
	isDismissible: PropTypes.bool,
	dismissLabel: PropTypes.string,
	onDismiss: PropTypes.func,
	variant: PropTypes.oneOf( Object.values( VARIANTS ) ),
	hideIcon: PropTypes.bool,
};

export default SubtleNotification;

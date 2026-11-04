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
import { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_BODY,
} from '@/js/components/Typography/constants';
import { NOTICE_TYPES, NOTICE_VARIANTS } from './constants';
import CTAButton from './CTAButton';
import Description from './Description';
import DismissButton, { DismissButtonProps } from './DismissButton';
import Icon from './Icon';
import Title from './Title';

function hasDismissButtonAction( dismissButton?: DismissButtonProps ) {
	if ( dismissButton?.variant === 'icon' ) {
		return (
			!! dismissButton.icon &&
			!! dismissButton.ariaLabel &&
			( dismissButton.onClick || dismissButton.href )
		);
	}

	return (
		!! dismissButton?.label ||
		!! dismissButton?.onClick ||
		!! dismissButton?.href
	);
}
export interface NoticeProps {
	actionContent?: ReactNode;
	className?: string;
	title?: ReactNode;
	description?: ReactNode;
	dismissButton?: DismissButtonProps;
	ctaButton?: Record< string, unknown >;
	type?: NOTICE_TYPES;
	hideIcon?: boolean;
	children?: ReactNode;
	variant?: NOTICE_VARIANTS;
}

const Notice = forwardRef< HTMLDivElement, NoticeProps >(
	(
		{
			actionContent,
			className,
			title,
			description,
			dismissButton,
			ctaButton,
			type = NOTICE_TYPES.INFO,
			children,
			hideIcon,
			variant = NOTICE_VARIANTS.DEFAULT,
		},
		ref
	) => {
		const hasDismissAction = hasDismissButtonAction( dismissButton );
		const hasCTAAction =
			!! ctaButton?.label && ( ctaButton?.onClick || ctaButton?.href );
		const hasActionContent =
			!! actionContent || hasDismissAction || hasCTAAction;

		const isSmall = [
			NOTICE_VARIANTS.SIDE_PANEL,
			NOTICE_VARIANTS.SMALL,
		].includes( variant );

		const size = isSmall ? SIZE_SMALL : SIZE_MEDIUM;

		return (
			<div className="googlesitekit-notice-container" ref={ ref }>
				<div
					className={ classnames(
						'googlesitekit-notice',
						`googlesitekit-notice--${ type }`,
						`googlesitekit-notice--${ variant }`,
						className
					) }
					role="status"
				>
					{ ! hideIcon && (
						<div className="googlesitekit-notice__icon">
							<Icon type={ type } />
						</div>
					) }

					<Typography
						as="div"
						className="googlesitekit-notice__content"
						size={ size }
						type={ TYPE_BODY }
					>
						{ title && <Title size={ size }>{ title }</Title> }
						{ description && (
							<Description size={ size }>
								{ description }
							</Description>
						) }
						{ children }
					</Typography>

					{ hasActionContent && (
						<div className="googlesitekit-notice__action">
							{ actionContent }

							{ hasDismissAction && (
								<DismissButton { ...( dismissButton || {} ) } />
							) }
							{ hasCTAAction && (
								<CTAButton
									// @ts-expect-error `CTAButton` component is not yet typed.
									label={ ctaButton.label }
									// @ts-expect-error `CTAButton` component is not yet typed.
									onClick={ ctaButton.onClick }
									// @ts-expect-error `CTAButton` component is not yet typed.
									inProgress={ ctaButton.inProgress }
									// @ts-expect-error `CTAButton` component is not yet typed.
									disabled={ ctaButton.disabled }
									// @ts-expect-error `CTAButton` component is not yet typed.
									href={ ctaButton.href }
									// @ts-expect-error `CTAButton` component is not yet typed.
									external={ ctaButton.external }
									// @ts-expect-error `CTAButton` component is not yet typed.
									hideExternalIndicator={
										ctaButton.hideExternalIndicator
									}
									// @ts-expect-error `CTAButton` component is not yet typed.
									tertiary={ ctaButton.tertiary }
								/>
							) }
						</div>
					) }
				</div>
			</div>
		);
	}
);

export default Notice;

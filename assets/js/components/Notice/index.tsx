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
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Icon from './Icon';
import Title from './Title';
import Description from './Description';
import CTAButton from './CTAButton';
import DismissButton from './DismissButton';
import { NOTICE_TYPES } from './constants';
import { DismissButtonProps } from './DismissButtonProps';

export interface NoticeProps {
	actionContent?: ReactNode;
	className?: string;
	title?: ReactNode;
	description?: ReactNode;
	dismissButton?: DismissButtonProps;
	ctaButton?: Record< string, unknown >;
	type?: NOTICE_TYPES;
	hideIcon?: boolean;
}

const Notice: FC< NoticeProps > = forwardRef< HTMLDivElement, NoticeProps >(
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
		},
		ref
	) => {
		return (
			<div className="googlesitekit-notice-container" ref={ ref }>
				<div
					className={ classnames(
						'googlesitekit-notice',
						`googlesitekit-notice--${ type }`,
						className
					) }
					role="status"
				>
					{ ! hideIcon && (
						<div className="googlesitekit-notice__icon">
							<Icon type={ type } />
						</div>
					) }

					<div className="googlesitekit-notice__content">
						{ title && <Title>{ title }</Title> }
						{ description && (
							<Description>{ description }</Description>
						) }
						{ children }
					</div>

					{ ( dismissButton?.label ||
						dismissButton?.onClick ||
						( ctaButton?.label &&
							( ctaButton?.onClick || ctaButton?.href ) ) ||
						actionContent ) && (
						<div className="googlesitekit-notice__action">
							{ actionContent }

							{ ( dismissButton?.label ||
								dismissButton?.onClick ) && (
								<DismissButton
									label={ dismissButton.label }
									// @ts-expect-error `DismissButton` component is not yet typed.
									onClick={ dismissButton.onClick }
									disabled={ dismissButton.disabled }
									href={ dismissButton.href }
									external={ dismissButton.external }
								/>
							) }
							{ ctaButton?.label &&
								( ctaButton?.onClick || ctaButton?.href ) && (
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

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
import { FC, ReactChild } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import CTAButton, { CTAButtonProps } from './CTAButton';
import Description from './Description';
import DismissButton, { DismissButtonProps } from './DismissButton';
import Footer from './Footer';
import HelpText from './HelpText';
import { LearnMoreLinkProps } from './LearnMoreLink';
import Title from './Title';
import TitleIcon from './TitleIcon';

export interface BannerProps {
	className?: string;
	titleIcon?: ReactChild;
	title?: string;
	description?: ReactChild;
	additionalDescription?: ReactChild;
	errorText?: string;
	helpText?: string;
	learnMoreLink?: LearnMoreLinkProps;
	dismissButton?: DismissButtonProps;
	ctaButton?: CTAButtonProps;
	svg?: {
		desktop?: string;
		mobile?: string;
		tablet?: string;
		verticalPosition?: 'top' | 'center' | 'bottom';
	};
	footer?: ReactChild;
}

function getSVGDataByBreakpoint(
	breakpoint: string,
	svg: BannerProps[ 'svg' ]
): string | null {
	const isMobile = breakpoint === BREAKPOINT_SMALL;
	const isTablet = breakpoint === BREAKPOINT_TABLET;

	if ( isTablet && svg?.tablet ) {
		return svg.tablet;
	}

	if ( ( isMobile || isTablet ) && svg?.mobile ) {
		return svg.mobile;
	}

	if ( ! isMobile && ! isTablet && svg?.desktop ) {
		return svg.desktop;
	}

	return null;
}

const Banner: FC< BannerProps > = forwardRef< HTMLDivElement, BannerProps >(
	(
		{
			className,
			titleIcon,
			title,
			description,
			additionalDescription,
			errorText,
			helpText,
			learnMoreLink,
			dismissButton,
			ctaButton,
			svg, // NOTE: SVGs must be imported with the ?url suffix for use as a backgroundImage in this component.
			footer,
		},
		ref
	) => {
		const breakpoint = useBreakpoint();
		const SVGData = getSVGDataByBreakpoint( breakpoint, svg );

		const svgMode = svg?.verticalPosition ? svg.verticalPosition : 'center';

		return (
			<div
				ref={ ref }
				className={ classnames( 'googlesitekit-banner', className ) }
			>
				<div className="googlesitekit-banner__content">
					{ titleIcon && <TitleIcon>{ titleIcon }</TitleIcon> }

					<Title>{ title }</Title>

					<Description
						description={ description }
						learnMoreLink={ learnMoreLink }
						additionalDescription={ additionalDescription }
					/>

					{ helpText && <HelpText>{ helpText }</HelpText> }

					{ errorText && (
						<Notice
							type={ NOTICE_TYPES.ERROR }
							description={ errorText }
						/>
					) }

					<div className="googlesitekit-notice__action">
						{ ctaButton && <CTAButton { ...ctaButton } /> }
						{ dismissButton?.onClick && (
							<DismissButton { ...dismissButton } />
						) }
					</div>
				</div>

				{ SVGData && (
					<div
						className={ classnames(
							'googlesitekit-banner__svg-wrapper',
							{
								[ `googlesitekit-banner__svg-wrapper--${ svgMode }` ]:
									svgMode,
							}
						) }
						style={ { backgroundImage: `url(${ SVGData })` } }
					/>
				) }

				{ footer && <Footer>{ footer }</Footer> }
			</div>
		);
	}
);

export default Banner;

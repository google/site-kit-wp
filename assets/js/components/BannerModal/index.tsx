/**
 * BannerModal component.
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
import { FC, MouseEvent, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import NewBadge from '@/js/components/NewBadge';
import Typography from '@/js/components/Typography';
import P from '@/js/components/Typography/P';
import { Dialog, DialogContent, DialogFooter } from '@/js/material-components';
import CloseIcon from '@/svg/icons/close.svg';
import { GraphicContainerWithIntersectionObserver } from './GraphicContainer';

export interface BannerModalProps {
	className?: string;
	Graphic: FC;
	newBadge?: boolean;
	onView: () => void;
	onClose: () => void;
	title: ReactNode;
	description: ReactNode;
	ctaButton?: {
		label: string;
		onClick?: (
			event: MouseEvent< HTMLAnchorElement | HTMLButtonElement >
		) => void;
	};
	dismissButton?: {
		label?: string;
		onClick?: (
			event: MouseEvent< HTMLAnchorElement | HTMLButtonElement >
		) => void;
	};
}

/**
 * Renders a modal with a graphic, title, description, and optional buttons.
 *
 * Mainly used for new feature or setup complete announcements, but can be used for other purposes as well.
 *
 * @since 1.179.0
 *
 * @param props               Component props.
 * @param props.className     Additional CSS class name(s) to apply to the root Dialog element.
 * @param props.Graphic       SVG graphic component to render in the modal header.
 * @param props.onView        Callback invoked when the modal content scrolls into view, used for tracking purposes.
 * @param props.onClose       Callback invoked when the modal is closed.
 * @param props.title         Modal title text.
 * @param props.description   Modal description content (string or element).
 * @param props.newBadge      Whether to display a "New" badge in the modal.
 * @param props.ctaButton     Configuration object for the primary CTA button.
 * @param props.dismissButton Configuration object for the dismiss button.
 * @return                    BannerModal component.
 */
const BannerModal: FC< BannerModalProps > = ( {
	className,
	Graphic,
	newBadge = false,
	onView,
	onClose,
	title,
	description,
	ctaButton,
	dismissButton,
} ) => {
	return (
		<Dialog
			className={ classnames(
				'googlesitekit-dialog',
				'googlesitekit-dialog--with-mobile-margins',
				'googlesitekit-banner-modal',
				className
			) }
			onClose={ onClose }
			open
		>
			<DialogContent className="googlesitekit-banner-modal__content">
				{ /* The `GraphicContainerWithIntersectionObserver` is used here to track when the
				graphic (and thus the main content of the modal) comes into view, which is needed
				for analytics tracking. */ }
				<GraphicContainerWithIntersectionObserver
					onInView={ onView }
					className="googlesitekit-banner-modal__graphic"
				>
					<Graphic />

					<Button
						// @ts-expect-error - The `Button` component is not typed yet.
						className="googlesitekit-banner-modal__close-button"
						icon={ <CloseIcon width={ 10 } height={ 10 } /> }
						onClick={ onClose }
						aria-label={ __( 'Close', 'google-site-kit' ) }
						hideTooltipTitle
					/>
				</GraphicContainerWithIntersectionObserver>

				<div className="googlesitekit-banner-modal__text">
					{ newBadge && <NewBadge hasNoSpacing /> }

					<Typography
						as="h1"
						className="googlesitekit-banner-modal__title"
						size="large"
						type="headline"
					>
						{ title }
					</Typography>

					<P
						type="body"
						size="medium"
						className="googlesitekit-banner-modal__description"
					>
						{ description }
					</P>
				</div>
			</DialogContent>
			<DialogFooter className="googlesitekit-banner-modal__footer">
				<Fragment>
					{ dismissButton && (
						// @ts-expect-error - The `Button` component is not typed yet.
						<Button onClick={ dismissButton.onClick } tertiary>
							{ dismissButton.label ||
								__( 'Maybe later', 'google-site-kit' ) }
						</Button>
					) }

					{ ctaButton && (
						// @ts-expect-error - The `Button` component is not typed yet.
						<Button onClick={ ctaButton.onClick }>
							{ ctaButton.label }
						</Button>
					) }
				</Fragment>
			</DialogFooter>
		</Dialog>
	);
};

export default BannerModal;

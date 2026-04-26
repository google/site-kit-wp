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
import { FC, MouseEvent, ReactNode, Ref } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import { Dialog, DialogContent, DialogFooter } from '@/js/material-components';
import P from '@/js/components/Typography/P';
import Typography from '@/js/components/Typography';
// @ts-expect-error - We need to add types for imported SVGs.
import CloseIcon from '@/svg/icons/close.svg';

export interface BannerModalProps {
	Graphic?: FC;
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
	intersectionRef?: Ref< HTMLDivElement >;
}

/**
 * Renders a modal with a graphic, title, description, and optional buttons.
 *
 * Mainly used for new feature or setup complete announcements, but can be used for other purposes as well.
 *
 * @since n.e.x.t
 *
 * @param props                 Component props.
 * @param props.Graphic         SVG graphic component to render in the modal header.
 * @param props.onClose         Callback invoked when the modal is closed.
 * @param props.title           Modal title text.
 * @param props.description     Modal description content (string or element).
 * @param props.ctaButton       Configuration object for the primary CTA button.
 * @param props.dismissButton   Configuration object for the dismiss button.
 * @param props.intersectionRef Ref forwarded to the first container div.
 * @return                      BannerModal component.
 */
const BannerModal: FC< BannerModalProps > = ( {
	Graphic,
	onClose,
	title,
	description,
	ctaButton,
	dismissButton,
	intersectionRef,
} ) => {
	return (
		<Dialog
			className="googlesitekit-dialog googlesitekit-dialog--with-mobile-margins googlesitekit-welcome-modal"
			onClose={ onClose }
			open
		>
			<DialogContent className="googlesitekit-welcome-modal__content">
				<div
					ref={ intersectionRef }
					className="googlesitekit-welcome-modal__graphic"
				>
					{ Graphic && <Graphic /> }

					<Button
						// @ts-expect-error - The `Button` component is not typed yet.
						className="googlesitekit-welcome-modal__close-button"
						icon={ <CloseIcon width={ 10 } height={ 10 } /> }
						onClick={ onClose }
						aria-label={ __( 'Close', 'google-site-kit' ) }
						hideTooltipTitle
					/>
				</div>

				<div className="googlesitekit-welcome-modal__text">
					<Typography
						as="h1"
						className="googlesitekit-welcome-modal__title"
						size="large"
						type="headline"
					>
						{ title }
					</Typography>

					<P
						type="body"
						size="medium"
						className="googlesitekit-welcome-modal__description"
					>
						{ description }
					</P>
				</div>
			</DialogContent>

			<DialogFooter className="googlesitekit-welcome-modal__footer">
				<Fragment>
					{ dismissButton && (
						// @ts-expect-error - The `Button` component is not typed yet.
						<Button onClick={ dismissButton.onClick } tertiary>
							{ dismissButton.label ||
								__( 'Got it', 'google-site-kit' ) }
						</Button>
					) }

					{ ctaButton && (
						// @ts-expect-error - The `SpinnerButton` component is not typed yet.
						<SpinnerButton onClick={ ctaButton.onClick }>
							{ ctaButton.label }
						</SpinnerButton>
					) }
				</Fragment>
			</DialogFooter>
		</Dialog>
	);
};

export default BannerModal;

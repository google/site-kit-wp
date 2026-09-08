/**
 * OverlayNotification layout component.
 *
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
import { ComponentType, FC, MouseEvent, ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import OverlayCard from '@/js/components/OverlayCard';
import Popper from '@/js/googlesitekit/components-gm2/Popper';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import { BREAKPOINT_SMALL, useBreakpoint } from '@/js/hooks/useBreakpoint';
import { GATrackingEventArgs } from '@/js/types/GATrackingEventArgs';

// Shift of the anchored card along the anchor's edge, so the caret sits
// off-centre within the card rather than at its corner, per the design.
const ANCHORED_SKIDDING_PX = 48;

type OverlayButtonEvent = MouseEvent< HTMLAnchorElement | HTMLButtonElement >;

interface OverlayButtonProps {
	label?: string;
	onClick?: ( event: OverlayButtonEvent ) => void | Promise< void >;
	disabled?: boolean;
	dismissOptions?: Record< string, unknown >;
}

interface OverlayCTAButtonProps extends OverlayButtonProps {
	href?: string;
	target?: string;
	trailingIcon?: ReactElement;
	dismissOnClick?: boolean;
}

interface OverlayNotificationProps {
	notificationID: string;
	title?: string;
	description?: string | ReactElement;
	ctaButton?: OverlayCTAButtonProps;
	dismissButton?: OverlayButtonProps | boolean;
	GraphicDesktop?: ComponentType;
	GraphicMobile?: ComponentType;
	newBadge?: boolean;
	className?: string;
	/**
	 * Selector for the element to anchor to. Accepts a selector list, so an
	 * overlay whose trigger collapses into another control at narrower
	 * breakpoints can name each candidate and anchor to whichever exists.
	 */
	anchorID?: string;
	gaTrackingEventArgs?: GATrackingEventArgs & {
		confirmAction?: string;
		dismissAction?: string;
	};
}

const OverlayNotification: FC< OverlayNotificationProps > = ( {
	notificationID,
	ctaButton,
	dismissButton,
	gaTrackingEventArgs,
	className,
	anchorID,
	...props
} ) => {
	const trackEvents = useNotificationEvents(
		notificationID,
		gaTrackingEventArgs?.category,
		{
			confirmAction: gaTrackingEventArgs?.confirmAction,
			dismissAction: gaTrackingEventArgs?.dismissAction,
		}
	);

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const breakpoint = useBreakpoint();
	// eslint-disable-next-line sitekit/acronym-case
	const [ anchorElement, setAnchorElement ] = useState< HTMLElement | null >(
		null
	);

	useEffect( () => {
		setAnchorElement(
			// eslint-disable-next-line sitekit/acronym-case
			anchorID ? document.querySelector< HTMLElement >( anchorID ) : null
		);
	}, [ anchorID, breakpoint ] );

	const isAnchored =
		Boolean( anchorElement ) && breakpoint !== BREAKPOINT_SMALL;

	const dismissButtonProps =
		typeof dismissButton === 'object' ? dismissButton : undefined;

	async function handleDismissWithTrackEvent( event: OverlayButtonEvent ) {
		await dismissButtonProps?.onClick?.( event );
		trackEvents.dismiss(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);
		dismissNotification( notificationID, {
			...dismissButtonProps?.dismissOptions,
		} );
	}

	const { dismissOnClick, dismissOptions, ...otherCTAProps } =
		ctaButton || {};

	async function handleCTAClickWithTrackEvent( event: OverlayButtonEvent ) {
		trackEvents.confirm(
			gaTrackingEventArgs?.label,
			gaTrackingEventArgs?.value
		);
		await ctaButton?.onClick?.( event );

		if ( dismissOnClick ) {
			dismissNotification( notificationID, {
				...dismissOptions,
			} );
		}
	}

	const overlayCTAButton = ctaButton
		? {
				...otherCTAProps,
				onClick: handleCTAClickWithTrackEvent,
		  }
		: undefined;

	const card = (
		<OverlayCard
			className={ classnames( className, {
				'googlesitekit-overlay-card--anchored': isAnchored,
			} ) }
			disableAnimation={ isAnchored }
			ctaButton={ overlayCTAButton }
			dismissButton={ {
				...dismissButtonProps,
				onClick: handleDismissWithTrackEvent,
			} }
			{ ...props }
			visible
		/>
	);

	if ( ! isAnchored ) {
		return card;
	}

	return (
		<Popper
			anchorElement={ anchorElement }
			onClose={ () => {} }
			placement="bottom"
			autoDismissMs={ 0 }
			offset={ 12 }
			skidding={ isRTL() ? ANCHORED_SKIDDING_PX : -ANCHORED_SKIDDING_PX }
			className="googlesitekit-popper--overlay-notification"
			rootClassName="googlesitekit-popper-root--overlay-notification"
			arrow
			positionFixed
		>
			{ card }
		</Popper>
	);
};

export default OverlayNotification;

/**
 * AdminScreenTooltip component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import JoyrideTooltip from '@/js/components/JoyrideTooltip';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import { useHideTooltip } from './hooks/useHideTooltip';
import { useTooltipSettings } from './hooks/useTooltipSettings';

export function AdminScreenTooltip() {
	const viewContext = useViewContext();
	const breakpoint = useBreakpoint();

	const hideTooltip = useHideTooltip();
	const tooltipSettings = useTooltipSettings();

	const {
		isTooltipVisible = false,
		target,
		placement,
		className,
		tooltipSlug,
		title,
		content,
		dismissLabel,
		gaTrackingEventLabel,
		floaterProps,
		isCenteredOnMobile = true,
		onDismiss,
	} = tooltipSettings;

	function handleViewTooltip() {
		trackEvent(
			`${ viewContext }_${ tooltipSlug }`,
			'tooltip_view',
			gaTrackingEventLabel
		);
	}

	const handleDismissTooltip = useCallback( () => {
		// Track dismiss event.
		if ( tooltipSlug ) {
			trackEvent(
				`${ viewContext }_${ tooltipSlug }`,
				'tooltip_dismiss',
				gaTrackingEventLabel
			);
		}

		hideTooltip();
		onDismiss?.();
	}, [
		hideTooltip,
		tooltipSlug,
		viewContext,
		gaTrackingEventLabel,
		onDismiss,
	] );

	if ( ! isTooltipVisible ) {
		return null;
	}

	const isMobileTablet =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;

	const shouldCenter = isCenteredOnMobile && isMobileTablet;

	const desktopTarget =
		target ?? '#adminmenu [href*="page=googlesitekit-settings"]';

	const desktopPlacement = placement ?? 'right';

	function desktopClassName() {
		if ( className ) {
			return className;
		}
		return ! target
			? 'googlesitekit-tour-tooltip__fixed-settings-tooltip'
			: undefined;
	}

	return (
		<JoyrideTooltip
			target={ shouldCenter ? 'body' : desktopTarget }
			placement={ shouldCenter ? 'center' : desktopPlacement }
			className={
				shouldCenter
					? 'googlesitekit-tour-tooltip__modal_step'
					: desktopClassName()
			}
			disableOverlay={ ! shouldCenter }
			slug="admin-screen-tooltip"
			title={ title }
			content={ content }
			dismissLabel={ dismissLabel }
			onView={ handleViewTooltip }
			onDismiss={ handleDismissTooltip }
			floaterProps={ floaterProps }
		/>
	);
}

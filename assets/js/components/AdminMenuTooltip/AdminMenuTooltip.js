/**
 * AdminMenuTooltip component.
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
import { useDispatch, useSelect } from 'googlesitekit-data';
import JoyrideTooltip from '@/js/components/JoyrideTooltip';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { trackEvent } from '@/js/util';
import useViewContext from '@/js/hooks/useViewContext';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';

export function AdminMenuTooltip() {
	const viewContext = useViewContext();
	const { setValue } = useDispatch( CORE_UI );
	const breakpoint = useBreakpoint();

	const {
		isTooltipVisible = false,
		tooltipSlug,
		title,
		content,
		dismissLabel,
	} = useSelect(
		( select ) =>
			select( CORE_UI ).getValue( 'admin-menu-tooltip' ) || {
				isTooltipVisible: false,
			}
	);

	function handleViewTooltip() {
		trackEvent( `${ viewContext }_${ tooltipSlug }`, 'tooltip_view' );
	}

	const handleDismissTooltip = useCallback( () => {
		// Track dismiss event.
		if ( tooltipSlug ) {
			trackEvent(
				`${ viewContext }_${ tooltipSlug }`,
				'tooltip_dismiss'
			);
		}

		setValue( 'admin-menu-tooltip', undefined );
	}, [ setValue, tooltipSlug, viewContext ] );

	if ( ! isTooltipVisible ) {
		return null;
	}

	const defaultTarget = '#adminmenu [href*="page=googlesitekit-settings"]';
	const isMobileTablet =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;

	return (
		<JoyrideTooltip
			target={ isMobileTablet ? 'body' : defaultTarget }
			placement={ isMobileTablet ? 'center' : 'right' }
			className={
				isMobileTablet
					? 'googlesitekit-tour-tooltip__modal_step'
					: 'googlesitekit-tour-tooltip__fixed-settings-tooltip'
			}
			disableOverlay={ ! isMobileTablet }
			slug="ga4-activation-banner-admin-menu-tooltip"
			title={ title }
			content={ content }
			dismissLabel={ dismissLabel }
			onView={ handleViewTooltip }
			onDismiss={ handleDismissTooltip }
		/>
	);
}

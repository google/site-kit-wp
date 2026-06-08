/**
 * HelpMenu component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { useClickAway } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ESCAPE, TAB } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { Button, Menu } from 'googlesitekit-components';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { useWelcomeTour } from '@/js/feature-tours/hooks/useWelcomeTour';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { useFeature } from '@/js/hooks/useFeature';
import { useKeyCodesInside } from '@/js/hooks/useKeyCodesInside';
import useViewContext from '@/js/hooks/useViewContext';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { trackEvent } from '@/js/util';
import AdsenseHelpIcon from '@/svg/icons/adsense-help.svg';
import CompassIcon from '@/svg/icons/compass.svg';
import DocumentationIcon from '@/svg/icons/documentation.svg';
import FeedbackIcon from '@/svg/icons/feedback.svg';
import HelpIcon from '@/svg/icons/help.svg';
import SupportIcon from '@/svg/icons/support.svg';
import HelpMenuLink from './HelpMenuLink';

export default function HelpMenu( { children, showFeatureTour = false } ) {
	const [ menuOpen, setMenuOpen ] = useState( false );
	const menuWrapperRef = useRef();
	const viewContext = useViewContext();
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );

	useClickAway( menuWrapperRef, () => setMenuOpen( false ) );
	useKeyCodesInside( [ ESCAPE, TAB ], menuWrapperRef, () =>
		setMenuOpen( false )
	);

	const adSenseModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( MODULE_SLUG_ADSENSE )
	);

	const showFeatureTourMenuItem = useSelect(
		( select ) => {
			if ( ! showFeatureTour || ! setupFlowRefreshEnabled ) {
				return false;
			}

			const analyticsConnected = select( CORE_MODULES ).isModuleConnected(
				MODULE_SLUG_ANALYTICS_4
			);

			if ( analyticsConnected ) {
				return (
					select( MODULES_ANALYTICS_4 ).isGatheringData() === false
				);
			}

			return select( MODULES_SEARCH_CONSOLE ).isGatheringData() === false;
		},
		[ showFeatureTour, setupFlowRefreshEnabled ]
	);

	const handleMenu = useCallback( () => {
		if ( ! menuOpen ) {
			trackEvent( `${ viewContext }_headerbar`, 'open_helpmenu' );
		}

		setMenuOpen( ! menuOpen );
	}, [ menuOpen, viewContext ] );

	const handleMenuSelected = useCallback( () => {
		setMenuOpen( false );
	}, [] );

	const fixCommonIssuesURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'fix-common-issues'
		);
	} );

	const { triggerOnDemandTour } = useDispatch( CORE_USER );

	const welcomeTour = useWelcomeTour();

	const handleStartFeatureTour = useCallback( () => {
		triggerOnDemandTour( welcomeTour );
	}, [ triggerOnDemandTour, welcomeTour ] );

	const menuItems = [
		{
			gaEventLabel: 'fix_common_issues',
			href: fixCommonIssuesURL,
			children: __( 'Fix common issues', 'google-site-kit' ),
		},
		{
			gaEventLabel: 'documentation',
			href: 'https://sitekit.withgoogle.com/documentation/',
			children: __( 'Read help docs', 'google-site-kit' ),
		},
		{
			gaEventLabel: 'support_forum',
			href: 'https://wordpress.org/support/plugin/google-site-kit/',
			children: __( 'Get support', 'google-site-kit' ),
		},
		...( adSenseModuleActive
			? [
					{
						gaEventLabel: 'adsense_help',
						href: 'https://support.google.com/adsense/',
						children: __(
							'Get help with AdSense',
							'google-site-kit'
						),
					},
			  ]
			: [] ),
	];

	const setupFlowRefreshMenuItems = [
		{
			gaEventLabel: 'browse_documentation',
			href: 'https://sitekit.withgoogle.com/documentation/',
			icon: <DocumentationIcon width={ 24 } height={ 24 } />,
			children: __( 'Browse documentation', 'google-site-kit' ),
		},
		{
			gaEventLabel: 'get_support',
			href: 'https://wordpress.org/support/plugin/google-site-kit/',
			icon: <SupportIcon width={ 24 } height={ 24 } />,
			children: __( 'Get free support', 'google-site-kit' ),
		},
		...( showFeatureTourMenuItem
			? [
					{
						gaEventLabel: 'start_tour',
						onClick: handleStartFeatureTour,
						icon: <CompassIcon width={ 24 } height={ 24 } />,
						children: __(
							'Start a feature tour',
							'google-site-kit'
						),
					},
			  ]
			: [] ),
		{
			gaEventLabel: 'send_feedback',
			href: 'https://wordpress.org/support/plugin/google-site-kit/reviews/',
			icon: <FeedbackIcon width={ 24 } height={ 24 } />,
			children: __( 'Send feedback', 'google-site-kit' ),
		},
		...( adSenseModuleActive
			? [
					{
						gaEventLabel: 'get_adsense_help',
						href: 'https://support.google.com/adsense/',
						icon: <AdsenseHelpIcon width={ 24 } height={ 24 } />,
						children: __(
							'Get help with AdSense',
							'google-site-kit'
						),
					},
			  ]
			: [] ),
	];

	return (
		<div
			ref={ menuWrapperRef }
			className="googlesitekit-dropdown-menu googlesitekit-dropdown-menu__icon-menu mdc-menu-surface--anchor"
		>
			<Button
				aria-controls="googlesitekit-help-menu"
				aria-expanded={ menuOpen }
				aria-label={ __( 'Help', 'google-site-kit' ) }
				aria-haspopup="menu"
				className="googlesitekit-header__dropdown googlesitekit-border-radius-round googlesitekit-button-icon googlesitekit-help-menu__button mdc-button--dropdown"
				icon={ <HelpIcon width="20" height="20" /> }
				onClick={ handleMenu }
				tooltipEnterDelayInMS={ 500 }
				text
			/>
			<Menu
				className={ classnames( 'googlesitekit-width-auto', {
					'googlesitekit-help-menu': setupFlowRefreshEnabled,
				} ) }
				menuOpen={ menuOpen }
				id="googlesitekit-help-menu"
				onSelected={ handleMenuSelected }
			>
				{ children }
				{ ( setupFlowRefreshEnabled
					? setupFlowRefreshMenuItems
					: menuItems
				).map( ( item, index ) => (
					<HelpMenuLink key={ index } { ...item } />
				) ) }
			</Menu>
		</div>
	);
}

HelpMenu.propTypes = {
	children: PropTypes.node,
	showFeatureTour: PropTypes.bool,
};

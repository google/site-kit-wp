/**
 * External dependencies
 */
import classnames from 'classnames';
import { throttle } from 'lodash';
import { useMount } from 'react-use';
import { Chip } from '@material/react-chips';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import NavKeyMetricsIcon from '../../../../svg/icons/nav-key-metrics-icon.svg';
import NavTrafficIcon from '../../../../svg/icons/nav-traffic-icon.svg';
import NavContentIcon from '../../../../svg/icons/nav-content-icon.svg';
import NavSpeedIcon from '../../../../svg/icons/nav-speed-icon.svg';
import NavMonetizationIcon from '../../../../svg/icons/nav-monetization-icon.svg';
import {
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_MONETIZATION,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_TRAFFIC,
} from '../../../googlesitekit/constants';
import {
	CORE_UI,
	ACTIVE_CONTEXT_ID,
} from '../../../googlesitekit/datastore/ui/constants';
import useDashboardType from '../../../hooks/useDashboardType';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { getNavigationalScrollTop } from '../../../util/scroll';
import { trackEvent } from '../../../util';
import useViewContext from '../../../hooks/useViewContext';
import useViewOnly from '../../../hooks/useViewOnly';
import useVisibleSections from './hooks/useVisibleSections';
import { getDefaultChipID, isValidChipID } from './chipHelpers';

export default function Navigation() {
	const dashboardType = useDashboardType();
	const breakpoint = useBreakpoint();
	const viewContext = useViewContext();
	const viewOnlyDashboard = useViewOnly();

	const { setValue } = useDispatch( CORE_UI );
	const elementRef = useRef();

	const initialHash = global.location.hash?.substring( 1 );
	const [ selectedID, setSelectedID ] = useState( initialHash );
	const [ isJumpingTo, setIsJumpingTo ] = useState(
		initialHash || undefined
	);
	const [ isSticky, setIsSticky ] = useState( false );

	const {
		showKeyMetrics,
		showTraffic,
		showContent,
		showSpeed,
		showMonetization,
		visibleSections,
	} = useVisibleSections();

	const defaultChipID = getDefaultChipID( {
		showKeyMetrics,
		showTraffic,
		showContent,
		showSpeed,
		showMonetization,
		viewOnlyDashboard,
	} );

	const validChipID = isValidChipID( {
		showKeyMetrics,
		showTraffic,
		showContent,
		showSpeed,
		showMonetization,
	} );

	const handleSelect = useCallback(
		( { target } ) => {
			const chip = target.closest( '.mdc-chip' );
			// eslint-disable-next-line sitekit/acronym-case
			const chipID = chip?.dataset?.contextId;

			global.history.replaceState( {}, '', `#${ chipID }` );
			setIsJumpingTo( chipID );
			trackEvent( `${ viewContext }_navigation`, 'tab_select', chipID );

			global.scrollTo( {
				top:
					chipID !== defaultChipID
						? getNavigationalScrollTop( `#${ chipID }`, breakpoint )
						: 0,
				behavior: 'smooth',
			} );

			setTimeout( () => {
				setValue( ACTIVE_CONTEXT_ID, chipID );
			}, 50 );
		},
		[ defaultChipID, breakpoint, setValue, viewContext ]
	);

	useMount( () => {
		let chipID = initialHash;

		if ( ! chipID || ! validChipID( chipID ) ) {
			chipID = defaultChipID;
		}

		setValue( ACTIVE_CONTEXT_ID, chipID );
		setSelectedID( chipID );

		setTimeout( () => {
			const scrollTo =
				chipID !== defaultChipID
					? getNavigationalScrollTop( `#${ chipID }`, breakpoint )
					: 0;

			if ( global.scrollY === scrollTo ) {
				setValue( ACTIVE_CONTEXT_ID, undefined );
				return;
			}

			global.scrollTo( { top: scrollTo, behavior: 'smooth' } );
		}, 50 );
	} );

	useEffect( () => {
		const onScroll = () => {
			const yScroll = global.scrollY;
			const header = document.querySelector( '.googlesitekit-header' );
			const headerBottom = header?.getBoundingClientRect().bottom;
			const { top: navTop, bottom: navBottom } =
				elementRef.current?.getBoundingClientRect() || {};
			const entityHeader =
				document
					.querySelector( '.googlesitekit-entity-header' )
					?.getBoundingClientRect()?.bottom || 0;
			const margin = 20;

			setIsSticky( yScroll !== 0 && navTop === headerBottom );

			let closestID = defaultChipID;
			let closestTop = -Infinity;

			visibleSections.forEach( ( sectionID ) => {
				const section = document.getElementById( sectionID );
				if ( ! section ) {
					return;
				}

				const top =
					section.getBoundingClientRect().top -
					margin -
					( entityHeader || navBottom );
				if ( top < 0 && top > closestTop ) {
					closestTop = top;
					closestID = sectionID;
				}
			} );

			if ( isJumpingTo && isJumpingTo === closestID ) {
				setSelectedID( closestID );
				setIsJumpingTo( undefined );
				setValue( ACTIVE_CONTEXT_ID, undefined );
			} else if (
				! isJumpingTo &&
				global.location.hash?.substring( 1 ) !== closestID
			) {
				trackEvent(
					`${ viewContext }_navigation`,
					'tab_scroll',
					closestID
				);
				global.history.replaceState( {}, '', `#${ closestID }` );
				setSelectedID( closestID );
				setValue( ACTIVE_CONTEXT_ID, undefined );
			}
		};

		const throttledScroll = throttle( onScroll, 150 );
		global.addEventListener( 'scroll', throttledScroll );

		return () => {
			global.removeEventListener( 'scroll', throttledScroll );
		};
	}, [ isJumpingTo, visibleSections, defaultChipID, setValue, viewContext ] );

	const renderChip = ( id, label, Icon ) => (
		<Chip
			key={ id }
			id={ id }
			label={ label }
			leadingIcon={ <Icon width="18" height="16" /> }
			onClick={ handleSelect }
			selected={ selectedID === id }
			data-context-id={ id }
		/>
	);

	return (
		<nav
			className={ classnames(
				'mdc-chip-set',
				'googlesitekit-navigation',
				`googlesitekit-navigation--${ dashboardType }`,
				{ 'googlesitekit-navigation--is-sticky': isSticky }
			) }
			ref={ elementRef }
		>
			{ showKeyMetrics &&
				renderChip(
					ANCHOR_ID_KEY_METRICS,
					'Key metrics',
					NavKeyMetricsIcon
				) }
			{ showTraffic &&
				renderChip( ANCHOR_ID_TRAFFIC, 'Traffic', NavTrafficIcon ) }
			{ showContent &&
				renderChip( ANCHOR_ID_CONTENT, 'Content', NavContentIcon ) }
			{ showSpeed &&
				renderChip( ANCHOR_ID_SPEED, 'Speed', NavSpeedIcon ) }
			{ showMonetization &&
				renderChip(
					ANCHOR_ID_MONETIZATION,
					'Monetization',
					NavMonetizationIcon
				) }
		</nav>
	);
}

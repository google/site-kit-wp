/**
 * POC code. Not for use in production.
 */

/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useContext,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	ACTIVE_CONTEXT_ID,
	CORE_UI,
} from '../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import {
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_MONETIZATION,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_TRAFFIC,
} from '../../googlesitekit/constants';
import {
	CONTEXT_ENTITY_DASHBOARD_CONTENT,
	CONTEXT_ENTITY_DASHBOARD_MONETIZATION,
	CONTEXT_ENTITY_DASHBOARD_SPEED,
	CONTEXT_ENTITY_DASHBOARD_TRAFFIC,
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '../../googlesitekit/widgets/default-contexts';
import { getContextScrollTop } from '../../util/scroll';
import { trackEvent } from '../../util';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
} from '../../hooks/useDashboardType';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useFeature } from '../../hooks/useFeature';
import useViewContext from '../../hooks/useViewContext';
import useViewOnly from '../../hooks/useViewOnly';
const { useSelect, useDispatch } = Data;

const DashboardNavigationContext = createContext();

const { Consumer, Provider } = DashboardNavigationContext;

export function DashboardNavigationProvider( { children } ) {
	const initialHash = global.location.hash?.substring( 1 );
	const [ isJumpingTo, setIsJumpingTo ] = useState(
		initialHash || undefined
	);

	return (
		<Provider value={ { isJumpingTo, setIsJumpingTo } }>
			{ children }
		</Provider>
	);
}

export const DashboardNavigationConsumer = Consumer;

export function useIsJumpingTo() {
	const { isJumpingTo, setIsJumpingTo } = useContext(
		DashboardNavigationContext
	);

	return [ isJumpingTo, setIsJumpingTo ];
}

export function useWidgetContextOptions() {
	const viewOnlyDashboard = useViewOnly();

	const viewableModules = useSelect( ( select ) => {
		if ( ! viewOnlyDashboard ) {
			return null;
		}

		return select( CORE_USER ).getViewableModules();
	} );

	const widgetContextOptions = {
		modules: viewableModules ? viewableModules : undefined,
	};

	return widgetContextOptions;
}

export function useShowKeyMetrics() {
	const keyMetricsEnabled = useFeature( 'keyMetrics' );
	const dashboardType = useDashboardType();

	const isKeyMetricsWidgetHidden = useSelect(
		( select ) =>
			keyMetricsEnabled && select( CORE_USER ).isKeyMetricsWidgetHidden()
	);

	const widgetContextOptions = useWidgetContextOptions();

	const showKeyMetrics = useSelect( ( select ) => {
		if (
			! keyMetricsEnabled ||
			dashboardType !== DASHBOARD_TYPE_MAIN ||
			isKeyMetricsWidgetHidden === true
		) {
			return false;
		}

		return select( CORE_WIDGETS ).isWidgetContextActive(
			CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
			widgetContextOptions
		);
	} );
	return showKeyMetrics;
}

export function useShowContextAreas() {
	const dashboardType = useDashboardType();
	const widgetContextOptions = useWidgetContextOptions();

	const showTraffic = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_TRAFFIC
				: CONTEXT_ENTITY_DASHBOARD_TRAFFIC,
			widgetContextOptions
		)
	);

	const showContent = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_CONTENT
				: CONTEXT_ENTITY_DASHBOARD_CONTENT,
			widgetContextOptions
		)
	);

	const showSpeed = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_SPEED
				: CONTEXT_ENTITY_DASHBOARD_SPEED,
			widgetContextOptions
		)
	);

	const showMonetization = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetContextActive(
			dashboardType === DASHBOARD_TYPE_MAIN
				? CONTEXT_MAIN_DASHBOARD_MONETIZATION
				: CONTEXT_ENTITY_DASHBOARD_MONETIZATION,
			widgetContextOptions
		)
	);

	return {
		showTraffic,
		showContent,
		showSpeed,
		showMonetization,
	};
}

export function useGetDefaultChipID() {
	const viewOnlyDashboard = useViewOnly();
	const showKeyMetrics = useShowKeyMetrics();
	const { showTraffic, showContent, showSpeed, showMonetization } =
		useShowContextAreas();

	const getDefaultChipID = useCallback( () => {
		if ( showKeyMetrics ) {
			return ANCHOR_ID_KEY_METRICS;
		}

		if ( ! viewOnlyDashboard ) {
			return ANCHOR_ID_TRAFFIC;
		}

		if ( showTraffic ) {
			return ANCHOR_ID_TRAFFIC;
		}

		if ( showContent ) {
			return ANCHOR_ID_CONTENT;
		}

		if ( showSpeed ) {
			return ANCHOR_ID_SPEED;
		}

		if ( showMonetization ) {
			return ANCHOR_ID_MONETIZATION;
		}

		return '';
	}, [
		showKeyMetrics,
		showTraffic,
		showContent,
		showSpeed,
		showMonetization,
		viewOnlyDashboard,
	] );
	return getDefaultChipID;
}

export function useScrollToContextArea() {
	const breakpoint = useBreakpoint();
	const viewContext = useViewContext();
	const { setValue } = useDispatch( CORE_UI );

	const { setIsJumpingTo } = useContext( DashboardNavigationContext );
	const getDefaultChipID = useGetDefaultChipID();

	const scrollToContextArea = useCallback(
		( chipID ) => {
			// Note, chipID is the context ID.
			global.history.replaceState( {}, '', `#${ chipID }` );

			setIsJumpingTo( chipID );
			trackEvent( `${ viewContext }_navigation`, 'tab_select', chipID );

			global.scrollTo( {
				top:
					chipID !== getDefaultChipID()
						? getContextScrollTop( `#${ chipID }`, breakpoint )
						: 0,
				behavior: 'smooth',
			} );

			setTimeout( () => {
				setValue( ACTIVE_CONTEXT_ID, chipID );
			}, 50 );
		},
		[ setIsJumpingTo, viewContext, getDefaultChipID, breakpoint, setValue ]
	);

	return scrollToContextArea;
}

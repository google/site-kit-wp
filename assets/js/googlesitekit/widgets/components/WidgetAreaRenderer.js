/**
 * WidgetAreaRenderer component.
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
import PropTypes from 'prop-types';
import classnames from 'classnames';
// import { useWindowWidth } from '@react-hook/window-size/throttled';
import { useWindowWidth } from '../../../hooks/useWindowWidth';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { getWidgetLayout, combineWidgets, HIDDEN_CLASS } from '../util';
import { getStickyHeaderHeight } from '../../../util/scroll';
import { CORE_WIDGETS, WIDGET_AREA_STYLES } from '../datastore/constants';
import { CORE_UI, ACTIVE_CONTEXT_ID } from '../../datastore/ui/constants';
import { Cell, Grid, Row } from '../../../material-components';
import {
	useBreakpoint,
	BREAKPOINT_XLARGE,
	BREAKPOINT_DESKTOP,
	BREAKPOINT_TABLET,
	BREAKPOINT_SMALL,
} from '../../../hooks/useBreakpoint';
import InViewProvider from '../../../components/InViewProvider';
import WidgetRenderer from './WidgetRenderer';
import WidgetCellWrapper from './WidgetCellWrapper';
import WidgetErrorHandler from '../../../components/WidgetErrorHandler';
import useViewOnly from '../../../hooks/useViewOnly';
import { CORE_USER } from '../../datastore/user/constants';
import useLatestIntersection from '../../../hooks/useLatestIntersection';
import WidgetAreaHeader from './WidgetAreaHeader';

/**
 * Gets root margin value for the intersection hook.
 *
 * @since 1.69.0
 *
 * @param {string} breakpoint The current breakpoint.
 * @return {string} The root margin.
 */
function getRootMargin( breakpoint ) {
	const gridGaps = {
		[ BREAKPOINT_XLARGE ]: 48,
		[ BREAKPOINT_DESKTOP ]: 48,
		[ BREAKPOINT_TABLET ]: 32,
		[ BREAKPOINT_SMALL ]: 32,
	};

	const gap = gridGaps[ breakpoint ];
	const top = Math.abs( getStickyHeaderHeight( breakpoint ) + gap );

	return `${ -top }px ${ -gap }px ${ -gap }px ${ -gap }px`;
}

export default function WidgetAreaRenderer( { slug, contextID } ) {
	const viewOnlyDashboard = useViewOnly();

	const viewableModules = useSelect( ( select ) => {
		if ( ! viewOnlyDashboard ) {
			return null;
		}

		return select( CORE_USER ).getViewableModules();
	} );

	const windowWidth = useWindowWidth();
	const breakpoint = useBreakpoint();

	const widgetAreaRef = useRef();
	const intersectionEntry = useLatestIntersection( widgetAreaRef, {
		rootMargin: getRootMargin( breakpoint ),
		threshold: 0, // Trigger "in-view" as soon as one pixel is visible.
	} );

	const widgetArea = useSelect( ( select ) =>
		select( CORE_WIDGETS ).getWidgetArea( slug )
	);

	const { Icon, title, style, subtitle, CTA, Footer } = widgetArea;

	const widgets = useSelect( ( select ) =>
		select( CORE_WIDGETS ).getWidgets( slug, {
			modules: viewableModules ? viewableModules : undefined,
		} )
	);
	const widgetStates = useSelect( ( select ) =>
		select( CORE_WIDGETS ).getWidgetStates()
	);
	const isActive = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetAreaActive( slug, {
			modules: viewableModules ? viewableModules : undefined,
		} )
	);

	const activeContextID = useSelect( ( select ) =>
		select( CORE_UI ).getValue( ACTIVE_CONTEXT_ID )
	);

	const [ inViewState, setInViewState ] = useState( {
		key: `WidgetAreaRenderer-${ slug }`,
		value: activeContextID
			? activeContextID === contextID
			: !! intersectionEntry?.intersectionRatio,
	} );

	useEffect( () => {
		setInViewState( {
			key: `WidgetAreaRenderer-${ slug }`,
			value: activeContextID
				? activeContextID === contextID
				: !! intersectionEntry?.intersectionRatio,
		} );
	}, [ intersectionEntry, slug, activeContextID, contextID ] );

	const ctaWithSmallWindow = CTA && windowWidth <= 782;

	if ( viewableModules === undefined ) {
		return null;
	}

	// Compute the layout.
	const { columnWidths, rowIndexes } = getWidgetLayout(
		widgets,
		widgetStates
	);

	// Combine widgets with similar CTAs and prepare final props to pass to
	// `WidgetRenderer` below. Only one consecutive instance of a similar CTA
	// will be maintained (via an "override component"), and all other similar
	// ones will receive a CSS class to hide them.
	// A combined CTA will span the combined width of all widgets that it was
	// combined from.
	const { gridColumnWidths, overrideComponents } = combineWidgets(
		widgets,
		widgetStates,
		{
			columnWidths,
			rowIndexes,
		}
	);

	// Render all widgets.
	const widgetsOutput = widgets.map( ( widget, i ) => (
		<WidgetCellWrapper
			key={ `${ widget.slug }-wrapper` }
			gridColumnWidth={ gridColumnWidths[ i ] }
		>
			<WidgetErrorHandler slug={ widget.slug }>
				<WidgetRenderer
					OverrideComponent={
						overrideComponents[ i ]
							? () => {
									const { Component, metadata } =
										overrideComponents[ i ];
									return <Component { ...metadata } />;
							  }
							: undefined
					}
					slug={ widget.slug }
				/>
			</WidgetErrorHandler>
		</WidgetCellWrapper>
	) );

	return (
		<InViewProvider value={ inViewState }>
			{ !! isActive && (
				<Grid
					className={ classnames(
						'googlesitekit-widget-area',
						`googlesitekit-widget-area--${ slug }`,
						`googlesitekit-widget-area--${ style }`
					) }
					ref={ widgetAreaRef }
				>
					<Row>
						<Cell
							className="googlesitekit-widget-area-header"
							size={ 12 }
						>
							<WidgetAreaHeader
								slug={ slug }
								Icon={ Icon }
								title={ title }
								subtitle={ subtitle }
								CTA={ CTA }
							/>
						</Cell>
					</Row>

					<div className="googlesitekit-widget-area-widgets">
						<Row>
							{ style === WIDGET_AREA_STYLES.BOXES &&
								widgetsOutput }
							{ style === WIDGET_AREA_STYLES.COMPOSITE && (
								<Cell size={ 12 }>
									<Grid>
										<Row>{ widgetsOutput }</Row>
									</Grid>
								</Cell>
							) }
						</Row>
					</div>
					<Row>
						{ ctaWithSmallWindow && (
							<Cell
								className="googlesitekit-widget-area-footer"
								lgSize={ 12 }
								mdSize={ 4 }
								smSize={ 2 }
							>
								<div className="googlesitekit-widget-area-footer__cta">
									<CTA />
								</div>
							</Cell>
						) }
						{ Footer && (
							<Cell
								className="googlesitekit-widget-area-footer"
								lgSize={ 12 }
								mdSize={ ctaWithSmallWindow ? 4 : 8 }
								smSize={ ctaWithSmallWindow ? 2 : 4 }
							>
								<Footer />
							</Cell>
						) }
					</Row>
				</Grid>
			) }
			{
				// Here we render the bare output as it is guaranteed to render empty.
				// This is important compared to returning `null` so that the area
				// can maybe render later if conditions change for widgets to become
				// active.
				//
				// Returning `null` here however would have the side-effect of making
				// all widgets active again, which is why we must return the "null"
				// output.
			 }
			{ ! isActive && (
				<Grid
					className={ classnames(
						HIDDEN_CLASS,
						'googlesitekit-widget-area',
						{
							[ `googlesitekit-widget-area--${ slug }` ]: !! slug,
							[ `googlesitekit-widget-area--${ style }` ]:
								!! style,
						}
					) }
					ref={ widgetAreaRef }
				>
					{ widgetsOutput }
				</Grid>
			) }
		</InViewProvider>
	);
}

WidgetAreaRenderer.propTypes = {
	slug: PropTypes.string.isRequired,
	contextID: PropTypes.string,
};

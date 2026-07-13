/**
 * PDF Sections Selection Panel Content.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import {
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import {
	ORDERED_MAIN_DASHBOARD_CONTEXTS,
	PDFSection,
} from '@/js/components/pdf-export/constants';
import { isActivePDFWidget } from '@/js/components/pdf-export/pdf-widget-eligibility';
import { SelectionPanelContent } from '@/js/components/SelectionPanel';
import SelectionPanelNotice from '@/js/components/SelectionPanel/SelectionPanelNotice';
import Typography from '@/js/components/Typography';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import type { Widget, WidgetArea } from '@/js/googlesitekit/widgets/types';
import useViewOnly from '@/js/hooks/useViewOnly';
import Footer from './Footer';
import Header from './Header';
import PDFSectionCheckboxes from './PDFSectionCheckboxes';

interface PanelContentProps {
	closePanel: () => void;
}

const PanelContent: FC< PanelContentProps > = ( { closePanel } ) => {
	const viewOnly = useViewOnly();

	const availableSections = useSelect(
		( select: Select ): PDFSection[] => {
			const modules = viewOnly
				? select( CORE_USER ).getViewableModules()
				: undefined;

			// Wait for the viewable modules to resolve before deriving sections so
			// a view-only dashboard never briefly shows a section it cannot fill.
			if ( viewOnly && modules === undefined ) {
				return [];
			}

			// Wait for modules to load. Before they load, `isModuleConnected`
			// returns `undefined`, so the panel would treat a connected module
			// as disconnected and leave its section out of the default selection.
			if ( select( CORE_MODULES ).getModules() === undefined ) {
				return [];
			}

			const sections: PDFSection[] = [];

			ORDERED_MAIN_DASHBOARD_CONTEXTS.forEach( ( contextSlug ) => {
				const areas: WidgetArea[] =
					select( CORE_WIDGETS ).getWidgetAreas( contextSlug );

				// Merge the context's areas into one section, so a multi-area
				// context shows one section, not one per area. Traffic is the
				// case, since it holds the traffic charts and the audience tiles.
				// The areas of a context share the same `pdfTitle`, so the label
				// comes from the first area that has one.
				let label = '';
				const widgets: PDFSection[ 'widgets' ] = [];
				const widgetSlugs: string[] = [];

				areas.forEach( ( area ) => {
					const pdfWidgets: Widget[] = select( CORE_WIDGETS )
						.getWidgets( area.slug, { modules } )
						.filter( ( widget: Widget ) =>
							isActivePDFWidget( widget, select )
						);

					if ( pdfWidgets.length === 0 ) {
						return;
					}

					if ( ! label ) {
						label = area.pdfTitle || area.title || '';
					}

					pdfWidgets.forEach( ( widget ) => {
						if ( widget.pdf?.label ) {
							widgets.push( {
								slug: widget.slug,
								label: widget.pdf.label as string,
							} );
						}
						widgetSlugs.push( widget.slug );
					} );
				} );

				if ( widgetSlugs.length === 0 ) {
					return;
				}

				sections.push( {
					slug: contextSlug,
					label: label || contextSlug,
					contextSlug,
					widgets,
					widgetSlugs,
				} );
			} );

			return sections;
		},
		[ viewOnly ]
	);

	const selectedWidgetSlugs = useSelect(
		( select: Select ) => select( CORE_PDF ).getSelectedWidgetSlugs(),
		[]
	);

	const { setSelection } = useDispatch( CORE_PDF );

	// Maps every available widget slug to its dashboard context so contextSlugs
	// can be derived from the widget-level selection (the source of truth).
	const widgetContext = useMemo( () => {
		const map: Record< string, string > = {};
		availableSections.forEach( ( section ) => {
			section.widgetSlugs.forEach( ( widgetSlug ) => {
				map[ widgetSlug ] = section.contextSlug;
			} );
		} );
		return map;
	}, [ availableSections ] );

	const commitSelection = useCallback(
		(
			widgetSlugs: string[],
			widgetContextMap: Record< string, string >
		) => {
			const selectedContexts = new Set(
				widgetSlugs
					.map( ( slug ) => widgetContextMap[ slug ] )
					.filter( Boolean )
			);

			// Store the contexts in the dashboard's order, not the selection
			// order, so the report's section order stays fixed across
			// re-exports and toggles.
			const contextSlugs = ORDERED_MAIN_DASHBOARD_CONTEXTS.filter(
				( contextSlug ) => selectedContexts.has( contextSlug )
			);

			setSelection( { contextSlugs, widgetSlugs } );
		},
		[ setSelection ]
	);

	// Select every widget the first time it appears, so a late-resolving
	// widget is on by default. The audience tiles are the case, since they
	// wait on the configured audiences. Once seen, a widget the user clears
	// stays cleared.
	const seenWidgetsRef = useRef( new Set< string >() );
	useEffect( () => {
		const newWidgetSlugs = availableSections
			.flatMap( ( section ) => section.widgetSlugs )
			.filter( ( slug ) => ! seenWidgetsRef.current.has( slug ) );

		if ( newWidgetSlugs.length === 0 ) {
			return;
		}

		newWidgetSlugs.forEach( ( slug ) =>
			seenWidgetsRef.current.add( slug )
		);
		commitSelection(
			Array.from(
				new Set( [
					...( selectedWidgetSlugs || [] ),
					...newWidgetSlugs,
				] )
			),
			widgetContext
		);
	}, [
		availableSections,
		selectedWidgetSlugs,
		commitSelection,
		widgetContext,
	] );

	const toggleWidget = useCallback(
		( widgetSlug: string ) => {
			const nextSelection = selectedWidgetSlugs.includes( widgetSlug )
				? selectedWidgetSlugs.filter(
						( slug: string ) => slug !== widgetSlug
				  )
				: [ ...selectedWidgetSlugs, widgetSlug ];

			commitSelection( nextSelection, widgetContext );
		},
		[ selectedWidgetSlugs, commitSelection, widgetContext ]
	);

	const toggleSection = useCallback(
		( section: PDFSection ) => {
			const allSelected = section.widgetSlugs.every( ( slug ) =>
				selectedWidgetSlugs.includes( slug )
			);

			const nextSelection = allSelected
				? selectedWidgetSlugs.filter(
						( slug: string ) =>
							! section.widgetSlugs.includes( slug )
				  )
				: Array.from(
						new Set( [
							...selectedWidgetSlugs,
							...section.widgetSlugs,
						] )
				  );

			commitSelection( nextSelection, widgetContext );
		},
		[ selectedWidgetSlugs, commitSelection, widgetContext ]
	);

	const hasSelection = selectedWidgetSlugs.length > 0;

	return (
		<Fragment>
			<Header closePanel={ closePanel } />
			<SelectionPanelContent className="googlesitekit-pdf-download-panel__content">
				<PDFSectionCheckboxes
					sections={ availableSections }
					selectedWidgetSlugs={ selectedWidgetSlugs }
					toggleSection={ toggleSection }
					toggleWidget={ toggleWidget }
				/>
			</SelectionPanelContent>
			{ ! hasSelection && (
				<SelectionPanelNotice
					// @ts-expect-error - The `SelectionPanelNotice` component is not yet typed.
					className="googlesitekit-notice--side-panel googlesitekit-pdf-download-panel__notice"
					type={ NOTICE_TYPES.ERROR }
					description={
						/* @ts-expect-error - The `Typography` component does not yet expose `className` as optional. */
						<Typography type="label" size="small" as="span">
							{ __(
								'Select at least 1 topic',
								'google-site-kit'
							) }
						</Typography>
					}
				/>
			) }
			<Footer closePanel={ closePanel } hasSelection={ hasSelection } />
		</Fragment>
	);
};

export default PanelContent;

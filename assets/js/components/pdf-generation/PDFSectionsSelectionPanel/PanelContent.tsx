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
import { PDFSection } from '@/js/components/pdf-generation/constants';
import { SelectionPanelContent } from '@/js/components/SelectionPanel';
import SelectionPanelNotice from '@/js/components/SelectionPanel/SelectionPanelNotice';
import Typography from '@/js/components/Typography';
import { CORE_PDF } from '@/js/googlesitekit/datastore/pdf/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
	CONTEXT_MAIN_DASHBOARD_SITE_GOALS,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';
import type { Widget, WidgetArea } from '@/js/googlesitekit/widgets/types';
import useViewOnly from '@/js/hooks/useViewOnly';
import Footer from './Footer';
import Header from './Header';
import PDFSectionCheckboxes from './PDFSectionCheckboxes';

const MAIN_DASHBOARD_CONTEXTS = [
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
	CONTEXT_MAIN_DASHBOARD_SITE_GOALS,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
];

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

			const sections: PDFSection[] = [];

			MAIN_DASHBOARD_CONTEXTS.forEach( ( contextSlug ) => {
				const areas: WidgetArea[] =
					select( CORE_WIDGETS ).getWidgetAreas( contextSlug );

				areas.forEach( ( area ) => {
					const pdfWidgets: Widget[] = select( CORE_WIDGETS )
						.getWidgets( area.slug, { modules } )
						.filter( ( widget: Widget ) => !! widget.pdf );

					if ( pdfWidgets.length === 0 ) {
						return;
					}

					sections.push( {
						slug: area.slug,
						label: area.pdfTitle || area.title || area.slug,
						contextSlug,
						widgets: pdfWidgets
							.filter( ( widget ) => !! widget.pdf?.label )
							.map( ( widget ) => ( {
								slug: widget.slug,
								label: widget.pdf?.label as string,
							} ) ),
						widgetSlugs: pdfWidgets.map(
							( widget ) => widget.slug
						),
					} );
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
			const contextSlugs = Array.from(
				new Set(
					widgetSlugs
						.map( ( slug ) => widgetContextMap[ slug ] )
						.filter( Boolean )
				)
			);

			setSelection( { contextSlugs, widgetSlugs } );
		},
		[ setSelection ]
	);

	// Seed the selection with every available widget the first time they resolve.
	// Subsequent toggles (including deselecting everything) persist via `core/pdf`
	// for the rest of the session.
	const seededRef = useRef( false );
	useEffect( () => {
		if ( seededRef.current || availableSections.length === 0 ) {
			return;
		}

		seededRef.current = true;
		const allWidgetSlugs = availableSections.flatMap(
			( section ) => section.widgetSlugs
		);
		commitSelection( allWidgetSlugs, widgetContext );
	}, [ availableSections, commitSelection, widgetContext ] );

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

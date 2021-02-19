/**
 * Widgets layout utilities tests.
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
 * Internal dependencies
 */
import { getWidgetLayout } from './get-widget-layout';
import { WIDGET_WIDTHS } from '../datastore/constants';
import ReportZero from '../../../components/ReportZero';
import ActivateModuleCTA from '../../../components/ActivateModuleCTA';

describe( 'getWidgetLayout', () => {
	const quarter = { width: WIDGET_WIDTHS.QUARTER };
	const half = { width: WIDGET_WIDTHS.HALF };
	const full = { width: WIDGET_WIDTHS.FULL };
	const quarterOrHalf = { width: [ WIDGET_WIDTHS.QUARTER, WIDGET_WIDTHS.HALF ] };
	const halfOrQuarter = { width: [ WIDGET_WIDTHS.HALF, WIDGET_WIDTHS.QUARTER ] };
	const fullOrHalf = { width: [ WIDGET_WIDTHS.FULL, WIDGET_WIDTHS.HALF ] };

	const getQuarterWidget = ( slug ) => ( { slug, width: WIDGET_WIDTHS.QUARTER } );
	const getHalfWidget = ( slug ) => ( { slug, width: WIDGET_WIDTHS.HALF } );
	const getFullWidget = ( slug ) => ( { slug, width: WIDGET_WIDTHS.FULL } );

	const getRegularState = () => null;
	const getReportZeroState = ( moduleSlug ) => ( { Component: ReportZero, metadata: { moduleSlug } } );
	const getActivateModuleCTAState = ( moduleSlug ) => ( { Component: ActivateModuleCTA, metadata: { moduleSlug } } );

	it( 'computes expected class names', () => {
		const widgets = [
			// First row.
			getQuarterWidget( 'test1' ),
			getQuarterWidget( 'test2' ),
			getHalfWidget( 'test3' ),
			// Second row.
			getHalfWidget( 'test4' ),
			getQuarterWidget( 'test5' ),
			// Third row.
			getFullWidget( 'test6' ),
		];
		const widgetStates = {
			test1: getRegularState(),
			test2: getReportZeroState( 'search-console' ),
			test3: getReportZeroState( 'analytics' ),
			test4: getActivateModuleCTAState( 'adsense' ),
			test5: getActivateModuleCTAState( 'adsense' ),
			test6: getActivateModuleCTAState( 'adsense' ),
		};

		// Phone and tablet column widths are static based on the widget width.
		// Desktop column widths usually are as well, except for the case where
		// an entire row spans exactly 9 columns, in which case each widget
		// will be expanded by a third to fill the entire 12 columns.
		const expectedClassNames = [
			[
				'mdc-layout-grid__cell',
				'mdc-layout-grid__cell--span-2-phone',
				'mdc-layout-grid__cell--span-3-desktop',
				'mdc-layout-grid__cell--span-4-tablet',
			],
			[
				'mdc-layout-grid__cell',
				'mdc-layout-grid__cell--span-2-phone',
				'mdc-layout-grid__cell--span-3-desktop',
				'mdc-layout-grid__cell--span-4-tablet',
			],
			[
				'mdc-layout-grid__cell',
				'mdc-layout-grid__cell--span-6-desktop',
				'mdc-layout-grid__cell--span-8-tablet',
			],
			[
				'mdc-layout-grid__cell',
				'mdc-layout-grid__cell--span-8-desktop',
				'mdc-layout-grid__cell--span-8-tablet',
			],
			[
				'mdc-layout-grid__cell',
				'mdc-layout-grid__cell--span-2-phone',
				'mdc-layout-grid__cell--span-4-desktop',
				'mdc-layout-grid__cell--span-4-tablet',
			],
			[
				'mdc-layout-grid__cell',
				'mdc-layout-grid__cell--span-12',
			],
		];

		expect( getWidgetLayout( widgets, widgetStates ).classNames ).toEqual( expectedClassNames );
	} );

	it( 'computes expected column widths in a single row', () => {
		const widgets = [
			getQuarterWidget( 'test1' ),
			getHalfWidget( 'test2' ),
			getQuarterWidget( 'test3' ),
		];
		const widgetStates = {
			test1: getRegularState(),
			test2: getRegularState(),
			test3: getRegularState(),
		};

		const expectedColumnWidths = [ 3, 6, 3 ];
		const expectedRowIndexes = [ 0, 0, 0 ];

		const { columnWidths, rowIndexes } = getWidgetLayout( widgets, widgetStates );
		expect( columnWidths ).toEqual( expectedColumnWidths );
		expect( rowIndexes ).toEqual( expectedRowIndexes );
	} );

	it( 'computes expected column widths across multiple rows', () => {
		const widgets = [ half, half, full, quarter, half, quarter, quarter, quarter, quarter, quarter ];
		const widgetStates = {};
		const expectedColumnWidths = [ 6, 6, 12, 3, 6, 3, 3, 3, 3, 3 ];
		const expectedRowIndexes = [ 0, 0, 1, 2, 2, 2, 3, 3, 3, 3 ];

		const { columnWidths, rowIndexes } = getWidgetLayout( widgets, widgetStates );
		expect( columnWidths ).toEqual( expectedColumnWidths );
		expect( rowIndexes ).toEqual( expectedRowIndexes );
	} );

	it( 'expands 3/4 rows into full-width rows', () => {
		const widgets = [ half, quarter, full, quarter, quarter, quarter, half, quarter ];
		const widgetStates = {};
		const expectedColumnWidths = [ 8, 4, 12, 4, 4, 4, 8, 4 ];
		const expectedRowIndexes = [ 0, 0, 1, 2, 2, 2, 3, 3 ];

		const { columnWidths, rowIndexes } = getWidgetLayout( widgets, widgetStates );
		expect( columnWidths ).toEqual( expectedColumnWidths );
		expect( rowIndexes ).toEqual( expectedRowIndexes );
	} );

	it( 'chooses best supported widget width to fit single row', () => {
		const widgets = [ quarter, quarterOrHalf, fullOrHalf ];
		const widgetStates = {};
		const expectedColumnWidths = [ 3, 3, 6 ];
		const expectedRowIndexes = [ 0, 0, 0 ];

		const { columnWidths, rowIndexes } = getWidgetLayout( widgets, widgetStates );
		expect( columnWidths ).toEqual( expectedColumnWidths );
		expect( rowIndexes ).toEqual( expectedRowIndexes );
	} );

	it( 'chooses best supported widget width to fit multiple rows', () => {
		const widgets = [ quarter, halfOrQuarter, fullOrHalf, halfOrQuarter, fullOrHalf ];
		const widgetStates = {};
		const expectedColumnWidths = [ 3, 3, 6, 4, 8 ];
		const expectedRowIndexes = [ 0, 0, 0, 1, 1 ];

		const { columnWidths, rowIndexes } = getWidgetLayout( widgets, widgetStates );
		expect( columnWidths ).toEqual( expectedColumnWidths );
		expect( rowIndexes ).toEqual( expectedRowIndexes );
	} );
} );

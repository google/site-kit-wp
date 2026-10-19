/**
 * ModulePopularPagesWidgetGA4 component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { ElementType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import WidgetTabBar from '@/js/components/WidgetTabBar';
import { useFeature } from '@/js/hooks/useFeature';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import whenActive from '@/js/util/when-active';
import { LATEST_CONTENT_TAB_ID, TOP_CONTENT_TAB_ID } from './constants';
import Footer from './Footer';
import Header from './Header';
import LatestContentHeader from './LatestContentHeader';
import LatestContentTable from './LatestContentTable';
import TopContentTable from './TopContentTable';

/**
 * Props for the Popular content widget.
 *
 * @since n.e.x.t
 */
interface ModulePopularPagesWidgetGA4Props {
	/** The widget wrapper component. */
	Widget: ElementType;
	/** The component the tables render when a request fails. */
	WidgetReportError: ElementType;
}

const ModulePopularPagesWidgetGA4: FC< ModulePopularPagesWidgetGA4Props > = ( {
	Widget,
	WidgetReportError,
} ) => {
	const freshDataEnabled = useFeature( 'freshData' );

	const activeTabID = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getActiveContentTab() ??
			TOP_CONTENT_TAB_ID,
		[]
	);

	const { setActiveContentTab } = useDispatch( MODULES_ANALYTICS_4 );

	if ( ! freshDataEnabled ) {
		return (
			<Widget Header={ Header } Footer={ Footer } noPadding>
				<TopContentTable WidgetReportError={ WidgetReportError } />
			</Widget>
		);
	}

	const isLatestContentActive = activeTabID === LATEST_CONTENT_TAB_ID;

	const ActiveTable = isLatestContentActive
		? LatestContentTable
		: TopContentTable;

	const tabs = [
		{
			id: TOP_CONTENT_TAB_ID,
			label: __( 'Top content', 'google-site-kit' ),
		},
		{
			id: LATEST_CONTENT_TAB_ID,
			label: __( 'Latest content', 'google-site-kit' ),
		},
	];

	return (
		<Widget
			className="googlesitekit-widget--footer-v2"
			Header={ isLatestContentActive ? LatestContentHeader : Header }
			Footer={ Footer }
			noPadding
		>
			<WidgetTabBar
				tabs={ tabs }
				activeTabID={ activeTabID }
				onTabChange={ setActiveContentTab }
			/>
			<div role="tabpanel" aria-labelledby={ activeTabID }>
				<ActiveTable WidgetReportError={ WidgetReportError } />
			</div>
		</Widget>
	);
};

export default whenActive( { moduleName: MODULE_SLUG_ANALYTICS_4 } )(
	ModulePopularPagesWidgetGA4
);

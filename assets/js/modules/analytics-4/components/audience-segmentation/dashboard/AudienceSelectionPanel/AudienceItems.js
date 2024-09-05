/**
 * Audience Selection Panel Audience Items
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../../datastore/constants';
import AudienceItem from './AudienceItem';
import { SelectionPanelItems } from '../../../../../../components/SelectionPanel';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from './constants';
import AudienceItemPreviewBlock from './AudienceItemPreviewBlock';

export default function AudienceItems( { savedItemSlugs = [] } ) {
	const [ firstView, setFirstView ] = useState( true );
	const { syncAvailableAudiences } = useDispatch( MODULES_ANALYTICS_4 );

	const isOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
	);

	const isLoading = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isFetchingSyncAvailableAudiences()
	);

	useEffect( () => {
		if ( ! firstView || ! isOpen ) {
			return;
		}

		syncAvailableAudiences();
		setFirstView( false );
	}, [ firstView, isOpen, syncAvailableAudiences ] );

	useEffect( () => {
		// @TODO Explore more elegant option to re-establish the focus. After `syncAvailableAudiences`
		// happens the focus is lost, even without preview block being shown.
		if ( ! isLoading && isOpen ) {
			const firstInput = document.querySelector(
				'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-item input'
			);
			if ( firstInput ) {
				firstInput.focus();
			}
		}
	}, [ isLoading, isOpen ] );

	const availableAudiences = useSelect( ( select ) => {
		const {
			getConfigurableAudiences,
			getReport,
			getAudiencesUserCountReportOptions,
			getConfiguredSiteKitAndOtherAudiences,
			hasAudiencePartialData,
		} = select( MODULES_ANALYTICS_4 );

		const audiences = getConfigurableAudiences();

		if ( undefined === audiences ) {
			return undefined;
		}

		if ( ! audiences.length ) {
			return [];
		}

		// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- We might return before `otherAudiences` is used.
		const [ siteKitAudiences, otherAudiences ] =
			getConfiguredSiteKitAndOtherAudiences();

		const isSiteKitAudiencePartialData =
			hasAudiencePartialData( siteKitAudiences );

		const dateRangeDates = select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );

		// Get the user count for the available Site Kit audiences using the `newVsReturning` dimension
		// to avoid the partial data state for these audiences.
		const newVsReturningReport =
			isSiteKitAudiencePartialData &&
			getReport( {
				...dateRangeDates,
				metrics: [
					{
						name: 'totalUsers',
					},
				],
				dimensions: [ { name: 'newVsReturning' } ],
			} );

		// Get the user count for the available audiences using the `audienceResourceName` dimension.
		const audienceResourceNameReport =
			isSiteKitAudiencePartialData === false || otherAudiences?.length > 0
				? getReport(
						getAudiencesUserCountReportOptions(
							isSiteKitAudiencePartialData
								? otherAudiences
								: audiences
						)
				  )
				: {};

		const { rows: newVsReturningRows = [] } = newVsReturningReport || {};
		const { rows: audienceResourceNameRows = [] } =
			audienceResourceNameReport || {};

		function findAudienceRow( rows, dimensionValue ) {
			return rows.find(
				( row ) => row?.dimensionValues?.[ 0 ]?.value === dimensionValue
			);
		}

		return audiences.map( ( audience ) => {
			let audienceRow;

			if (
				audience.audienceType === 'SITE_KIT_AUDIENCE' &&
				isSiteKitAudiencePartialData
			) {
				audienceRow = findAudienceRow(
					newVsReturningRows,
					audience.audienceSlug === 'new-visitors'
						? 'new'
						: 'returning'
				);
			} else {
				audienceRow = findAudienceRow(
					audienceResourceNameRows,
					audience.name
				);
			}

			return {
				...audience,
				userCount:
					Number( audienceRow?.metricValues?.[ 0 ]?.value ) || 0,
			};
		} );
	} );

	const audiencesListReducer = (
		acc,
		{ audienceType, description, displayName, name, userCount }
	) => {
		let citation = '';

		switch ( audienceType ) {
			case 'DEFAULT_AUDIENCE':
				citation = __(
					'Created by default by Google Analytics',
					'google-site-kit'
				);
				description = '';
				break;
			case 'SITE_KIT_AUDIENCE':
				citation = __( 'Created by Site Kit', 'google-site-kit' );
				break;
			case 'USER_AUDIENCE':
				citation = __(
					'Already exists in your Analytics property',
					'google-site-kit'
				);
				break;
		}

		return {
			...acc,
			[ name ]: {
				title: displayName,
				subtitle: description,
				description: citation,
				userCount,
			},
		};
	};

	const availableSavedItems = availableAudiences
		?.filter( ( { name } ) => savedItemSlugs.includes( name ) )
		.reduce( audiencesListReducer, {} );

	const availableUnsavedItems = availableAudiences
		?.filter( ( { name } ) => ! savedItemSlugs.includes( name ) )
		.reduce( audiencesListReducer, {} );

	return (
		<SelectionPanelItems
			availableItemsTitle={ __( 'Additional groups', 'google-site-kit' ) }
			availableSavedItems={ availableSavedItems }
			availableUnsavedItems={ availableUnsavedItems }
			ItemComponent={
				isLoading ? AudienceItemPreviewBlock : AudienceItem
			}
			savedItemSlugs={ savedItemSlugs }
		/>
	);
}

AudienceItems.propTypes = {
	savedItemSlugs: PropTypes.array,
};

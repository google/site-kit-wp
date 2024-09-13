/**
 * AudienceTilesWidget component.
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
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import whenActive from '../../../../../../util/when-active';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import AudienceTiles from './AudienceTiles';
import NoAudienceBanner from '../NoAudienceBannerWidget/NoAudienceBanner';
import AudienceTileLoading from './AudienceTile/AudienceTileLoading';

function AudienceTilesWidget( { Widget } ) {
	const availableAudiences = useSelect( ( select ) => {
		const audiences = select( MODULES_ANALYTICS_4 ).getAvailableAudiences();
		return audiences?.map( ( audience ) => audience.name );
	} );
	const configuredAudiences = useSelect( ( select ) =>
		select( CORE_USER ).getConfiguredAudiences()
	);

	const [ availableAudiencesSynced, setAvailableAudiencesSynced ] =
		useState( false );
	const { maybeSyncAvailableAudiences } = useDispatch( MODULES_ANALYTICS_4 );

	const isSettingUpAudiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isSettingUpAudiences()
	);

	useEffect( () => {
		if ( ! availableAudiencesSynced && ! isSettingUpAudiences ) {
			const syncAudiences = async () => {
				await maybeSyncAvailableAudiences();
				setAvailableAudiencesSynced( true );
			};

			syncAudiences();
		}
	}, [
		availableAudiencesSynced,
		isSettingUpAudiences,
		maybeSyncAvailableAudiences,
	] );

	const hasMatchingAudience = configuredAudiences?.some( ( audience ) =>
		availableAudiences?.includes( audience )
	);

	if ( ! hasMatchingAudience ) {
		return availableAudiencesSynced ? (
			<NoAudienceBanner />
		) : (
			<Widget className="googlesitekit-widget-audience-tiles" noPadding>
				<div className="googlesitekit-widget-audience-tiles__body">
					<Widget noPadding>
						<AudienceTileLoading />
					</Widget>
					<Widget noPadding>
						<AudienceTileLoading />
					</Widget>
				</div>
			</Widget>
		);
	}

	return (
		<AudienceTiles
			Widget={ Widget }
			widgetLoading={
				! availableAudiencesSynced ||
				! availableAudiences ||
				! configuredAudiences
			}
		/>
	);
}

AudienceTilesWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};

export default whenActive( { moduleName: 'analytics-4' } )(
	AudienceTilesWidget
);

/**
 * NoAudienceBannerWidget component.
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
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import whenActive from '../../../../../../util/when-active';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import NoAudienceBanner from './NoAudienceBanner';
import withIntersectionObserver from '../../../../../../util/withIntersectionObserver';
import { trackEvent } from '../../../../../../util';
import useViewContext from '../../../../../../hooks/useViewContext';

const NoAudienceBannerWithIntersectionObserver =
	withIntersectionObserver( NoAudienceBanner );

function NoAudienceBannerWidget( { Widget, WidgetNull } ) {
	const viewContext = useViewContext();

	const availableAudiences = useSelect( ( select ) => {
		const audiences = select( MODULES_ANALYTICS_4 ).getAvailableAudiences();
		return audiences?.map( ( audience ) => audience.name );
	} );

	const configuredAudiences = useSelect( ( select ) =>
		select( CORE_USER ).getConfiguredAudiences()
	);

	const didSetAudiences = useSelect( ( select ) =>
		select( CORE_USER ).didSetAudiences()
	);

	const hasNoMatchingAudience = configuredAudiences?.every(
		( audience ) =>
			Array.isArray( availableAudiences ) &&
			! availableAudiences.includes( audience )
	);
	if (
		!! configuredAudiences &&
		( configuredAudiences?.length === 0 || hasNoMatchingAudience )
	) {
		return (
			<Widget noPadding>
				<NoAudienceBannerWithIntersectionObserver
					onInView={ () => {
						trackEvent(
							`${ viewContext }_audiences-no-audiences`,
							'view_banner',
							didSetAudiences
								? 'no-longer-available'
								: 'none-selected'
						);
					} }
				/>
			</Widget>
		);
	}

	return <WidgetNull />;
}

NoAudienceBannerWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};

export default whenActive( { moduleName: 'analytics-4' } )(
	NoAudienceBannerWidget
);

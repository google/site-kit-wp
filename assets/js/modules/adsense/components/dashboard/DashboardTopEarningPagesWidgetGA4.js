/**
 * AdBlockerWarningWidget component.
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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ADSENSE_GA4_TOP_EARNING_PAGES_NOTICE_DISMISSED_ITEM_KEY as DISMISSED_KEY } from '../../constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import whenActive from '../../../../util/when-active';
import SettingsNotice from '../../../../components/SettingsNotice';
const { useSelect } = Data;

function DashboardTopEarningPagesWidgetGA4( { WidgetNull } ) {
	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( DISMISSED_KEY )
	);

	if ( isDismissed ) {
		return <WidgetNull />;
	}

	return (
		<SettingsNotice notice="Top earning pages are not yet available in Google Analytics 4.">
			Site Kit will notify you as soon as you can connect AdSense and
			Analytics again.
		</SettingsNotice>
	);
}

DashboardTopEarningPagesWidgetGA4.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( { moduleName: 'adsense' } )(
	DashboardTopEarningPagesWidgetGA4
);

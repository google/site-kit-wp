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
import { useSelect } from 'googlesitekit-data';
import AdBlockerWarning from '../../../../components/notifications/AdBlockerWarning';
import whenActive from '../../../../util/when-active';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';

function AdBlockerWarningWidget( { Widget, WidgetNull } ) {
	const isAdBlockerActive = useSelect( ( select ) =>
		select( CORE_USER ).isAdBlockerActive()
	);

	if ( ! isAdBlockerActive ) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding>
			<AdBlockerWarning moduleSlug="adsense" />
		</Widget>
	);
}

AdBlockerWarningWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( { moduleName: 'adsense' } )(
	AdBlockerWarningWidget
);

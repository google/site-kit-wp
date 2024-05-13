/**
 * PartnerAdsPAXWidget component.
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
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import whenActive from '../../../../util/when-active';
import whenScopesGranted from '../../../../util/whenScopesGranted';
import { ADWORDS_SCOPE, MODULES_ADS } from '../../datastore/constants';
import PAXEmbeddedApp from '../common/PAXEmbeddedApp';
import { AdBlockerWarning } from '../common';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../../../../googlesitekit/widgets/datastore/constants';
const { useSelect } = Data;

function PartnerAdsPAXWidget( { WidgetNull, Widget } ) {
	const isAdblockerActive = useSelect( ( select ) =>
		select( CORE_USER ).isAdBlockerActive()
	);

	const paxConversionID = useSelect( ( select ) =>
		select( MODULES_ADS ).getPaxConversionID()
	);

	const widgetRendered = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetActive( 'partnerAdsPAX' )
	);

	// If the user doesn't have a PAX Conversion ID, then they haven't set up
	// Google Ads Partner experience yet, so we shouldn't render the widget.
	//
	// If the widget is rendered but the user doesn't have a PAX Conversion ID,
	// the setup flow will be triggered and we don't want to show that in the
	// "reporting" widget.
	if ( ! paxConversionID?.length ) {
		return <WidgetNull />;
	}

	if ( isAdblockerActive ) {
		return (
			<Widget>
				<AdBlockerWarning />
			</Widget>
		);
	}

	// If the widget hasn't been rendered in the actual DOM yet,
	// don't load the PAX app.
	//
	// This is done to prevent the PAX app from launching before it's actually
	// inserted into the DOM.
	if ( ! widgetRendered ) {
		return <Widget noPadding />;
	}

	return (
		<Widget noPadding>
			<PAXEmbeddedApp displayMode="reporting" />
		</Widget>
	);
}

PartnerAdsPAXWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};

export default compose(
	whenActive( { moduleName: 'ads' } ),
	whenScopesGranted( { scopes: [ ADWORDS_SCOPE ] } )
)( PartnerAdsPAXWidget );

/**
 * ModuleApp component.
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
 * WordPress dependencies
 */
import { _x, sprintf, __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { isFeatureEnabled } from '../../features';
import Header from '../Header';
import Alert from '../Alert';
import PageHeader from '../PageHeader';
import ModuleFooter from './ModuleFooter';
import WidgetContextRenderer from '../../googlesitekit/widgets/components/WidgetContextRenderer';

import DateRangeSelector from '../DateRangeSelector';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';

const { useSelect } = Data;

function ModuleApp( { moduleSlug } ) {
	const screenWidgetContext = useSelect( ( select ) => select( CORE_MODULES ).getScreenWidgetContext( moduleSlug ) );
	const { slug } = moduleSlug;

	const moduleConnected = useSelect( ( select ) => select( CORE_MODULES ).isModuleConnected( slug ) );
	const ModuleIcon = useSelect( ( select ) => select( CORE_MODULES ).getModuleIcon( slug ) );
	const shouldRenderWidget = isFeatureEnabled( 'widgets.moduleScreens' ) && screenWidgetContext;
	const moduleStatusText = sprintf(
		/* translators: %s: module name. */
		__( '%s is connected', 'google-site-kit' ),
		_x( 'AdSense', 'Service name', 'google-site-kit' )
	);
	const moduleStatus = moduleConnected ? 'connected' : 'not-connected';

	return (
		<div>
			<Header>
				{ moduleConnected && <DateRangeSelector /> }
			</Header>
			<Alert module={ slug } />
			{ shouldRenderWidget &&
				<WidgetContextRenderer
					slug={ screenWidgetContext }
					className={ `googlesitekit-module-page googlesitekit-module-page--${ slug }` }
					Header={ () => (
						<PageHeader
							title={ _x( 'AdSense', 'Service name', 'google-site-kit' ) }
							icon={
								<ModuleIcon
									className="googlesitekit-page-header__icon"
									height="33"
									width="33"
								/>
							}
							status={ moduleStatus }
							statusText={ moduleStatusText }
						/>
					) }
				/>
			}
			<div>screenWidgetContext: { screenWidgetContext && `${ screenWidgetContext }` }</div>
			<div>{ isFeatureEnabled( 'widgets.moduleScreens' ) && 'enabled' }</div>
			<ModuleFooter />
		</div>
	);
}

ModuleApp.propTypes = {
	moduleSlug: PropTypes.object,
};

export default ModuleApp;

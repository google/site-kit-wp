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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Header from '../Header';
import DateRangeSelector from '../DateRangeSelector';

import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';

const { useSelect } = Data;

function ModuleApp( { moduleSlug } ) {
	const screenWidgetContext = useSelect( ( select ) => select( CORE_MODULES ).getScreenWidgetContext( moduleSlug ) );
	const moduleConnected = useSelect( ( select ) => select( CORE_MODULES ).isModuleConnected( 'analytics' ) );
	return (
		<div>
			<Header>
				{ moduleConnected && <DateRangeSelector /> }
			</Header>
			<div>It worked { screenWidgetContext && `${ screenWidgetContext }` }</div>
		</div>
	);
}

ModuleApp.propTypes = {
	moduleSlug: PropTypes.object,
};

export default ModuleApp;

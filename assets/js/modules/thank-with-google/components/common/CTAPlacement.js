/**
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { useCallback, useState, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	MODULES_THANK_WITH_GOOGLE,
	TYPE_FIXED,
	TYPE_OVERLAY,
} from '../../datastore/constants';
import { getPlacementType } from '../../util/settings';
import TypeRadio from './TypeRadio';
import ProminenceRadio from './ProminenceRadio';
import PositionRadio from './PositionRadio';
const { useSelect } = Data;

export default function CTAPlacement() {
	const ctaPlacement = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getCTAPlacement()
	);

	const defaultType = getPlacementType( ctaPlacement );

	const [ type, setType ] = useState( defaultType );
	const onChange = useCallback( setType, [ setType ] );

	return (
		<Fragment>
			<TypeRadio defaultType={ defaultType } onUpdate={ onChange } />
			{ type === TYPE_OVERLAY && <ProminenceRadio /> }
			{ type === TYPE_FIXED && <PositionRadio /> }
		</Fragment>
	);
}

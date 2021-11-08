/**
 * DashboardVerticalNav component.
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
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { TextField, Input } from '../material-components';

export default function DashboardVerticalNav() {
	const [ width, setWidth ] = useState( 186 );

	const onChange = useCallback(
		( { currentTarget } ) => {
			if ( ! currentTarget.value ) {
				return;
			}
			const value = parseInt( currentTarget.value.trim(), 10 );
			if ( isNaN( value ) || value <= 0 ) {
				return;
			}
			setWidth( value );
		},
		[ setWidth ]
	);

	const style = useMemo( () => ( { width } ), [ width ] );

	return (
		<div className="googlesitekit-vertical-nav" style={ style }>
			<TextField label="Vertical nav width" outlined>
				<Input
					id="verticalNavWidth"
					name="verticalNavWidth"
					value={ width }
					onChange={ onChange }
				/>
			</TextField>
		</div>
	);
}

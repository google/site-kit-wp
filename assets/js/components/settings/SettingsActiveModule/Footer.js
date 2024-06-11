/**
 * Footer component for SettingsActiveModule.
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
import { useParams } from 'react-router-dom';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { Cell, Grid, Row } from '../../../material-components';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import FooterPrimaryColumn from './FooterPrimaryColumn';
import FooterSecondaryColumn from './FooterSecondaryColumn';
const { useSelect } = Data;

export default function Footer( props ) {
	const { slug } = props;

	const { action, moduleSlug } = useParams();
	const isEditing = action === 'edit' && moduleSlug === slug;

	const isSavingKey = `module-${ slug }-isSaving`;

	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( slug )
	);

	const isSaving = useSelect( ( select ) =>
		select( CORE_UI ).getValue( isSavingKey )
	);

	if ( ! module ) {
		return null;
	}

	return (
		<footer className="googlesitekit-settings-module__footer">
			<Grid>
				<Row>
					<Cell lgSize={ 6 } mdSize={ 8 } smSize={ 4 }>
						<FooterPrimaryColumn
							slug={ slug }
							module={ module }
							isEditing={ isEditing }
							isSaving={ isSaving }
							isSavingKey={ isSavingKey }
						/>
					</Cell>
					<Cell
						lgSize={ 6 }
						mdSize={ 8 }
						smSize={ 4 }
						alignMiddle
						lgAlignRight
					>
						<FooterSecondaryColumn
							slug={ slug }
							module={ module }
							isEditing={ isEditing }
						/>
					</Cell>
				</Row>
			</Grid>
		</footer>
	);
}

Footer.propTypes = {
	slug: PropTypes.string.isRequired,
};

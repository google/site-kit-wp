/**
 * AudienceTileCollectingDataHideable component.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Link from '@/js/components/Link';
import { SIZE_SMALL, TYPE_TITLE } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import VisibilityIcon from '@/svg/icons/visibility.svg';

export default function AudienceTileCollectingDataHideable( { onHideTile } ) {
	return (
		<Fragment>
			<P
				className="googlesitekit-audience-segmentation-tile__zero-data-description"
				size={ SIZE_SMALL }
				type={ TYPE_TITLE }
			>
				{ __(
					'You can hide this group until data is available.',
					'google-site-kit'
				) }
			</P>
			<Link
				className="googlesitekit-audience-segmentation-tile-hide-cta"
				onClick={ onHideTile }
				leadingIcon={ <VisibilityIcon width={ 22 } height={ 22 } /> }
				secondary
				linkButton
			>
				{ __( 'Temporarily hide', 'google-site-kit' ) }
			</Link>
		</Fragment>
	);
}

AudienceTileCollectingDataHideable.propTypes = {
	onHideTile: PropTypes.func.isRequired,
};

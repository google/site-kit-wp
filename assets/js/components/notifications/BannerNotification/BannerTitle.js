/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import classnames from 'classnames';

/*
 * Internal dependencies
 */
import Badge from '../../Badge';
import Typography from '../../Typography';

export default function BannerTitle( props ) {
	const {
		title,
		badgeLabel,
		WinImageSVG,
		winImageFormat = '',
		smallWinImageSVGWidth = 75,
		smallWinImageSVGHeight = 75,
	} = props;

	if ( ! title ) {
		return null;
	}

	return (
		<div className="googlesitekit-publisher-win__title-image-wrapper">
			<Typography
				as="h3"
				type="headline"
				size="small"
				className="googlesitekit-heading-2 googlesitekit-publisher-win__title"
			>
				{ title }
				{ badgeLabel && <Badge label={ badgeLabel } /> }
			</Typography>

			{ WinImageSVG && (
				<div
					className={ classnames( {
						[ `googlesitekit-publisher-win__image-${ winImageFormat }` ]:
							winImageFormat,
					} ) }
				>
					<WinImageSVG
						width={ smallWinImageSVGWidth }
						height={ smallWinImageSVGHeight }
					/>
				</div>
			) }
		</div>
	);
}

BannerTitle.propTypes = {
	title: PropTypes.string,
	badgeLabel: PropTypes.string,
	WinImageSVG: PropTypes.elementType,
	winImageFormat: PropTypes.string,
	smallWinImageSVGWidth: PropTypes.number,
	smallWinImageSVGHeight: PropTypes.number,
};

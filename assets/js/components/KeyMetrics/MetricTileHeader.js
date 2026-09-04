/**
 * MetricTileHeader component.
 *
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

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import InfoTooltip from '@/js/components/InfoTooltip';
import Link from '@/js/components/Link';
import Typography from '@/js/components/Typography';
import VisuallyHidden from '@/js/components/VisuallyHidden';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';

export default function MetricTileHeader( {
	title,
	infoTooltip,
	loading,
	documentationLinkSlug,
} ) {
	const documentationURL = useSelect( ( select ) =>
		documentationLinkSlug
			? select( CORE_SITE ).getDocumentationLinkURL(
					documentationLinkSlug
			  )
			: undefined
	);

	const tooltipContent = documentationURL ? (
		<Fragment>
			{ infoTooltip }{ ' ' }
			<Link href={ documentationURL } external hideExternalIndicator>
				{ __( 'Learn more', 'google-site-kit' ) }
			</Link>
		</Fragment>
	) : (
		infoTooltip
	);

	return (
		<div className="googlesitekit-km-widget-tile__title-container">
			<Typography
				as="h3"
				size="small"
				type="label"
				className="googlesitekit-km-widget-tile__title"
			>
				{ title }
			</Typography>
			{ loading ? (
				<VisuallyHidden>
					<InfoTooltip title={ tooltipContent } />
				</VisuallyHidden>
			) : (
				<InfoTooltip title={ tooltipContent } />
			) }
		</div>
	);
}

MetricTileHeader.propTypes = {
	title: PropTypes.string,
	infoTooltip: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	loading: PropTypes.bool,
	documentationLinkSlug: PropTypes.string,
};

/**
 * A text link for the PDF report, with an optional trailing icon. With no URL,
 * the text renders plain.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { Link } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/stylesheet';
import { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFTypography, {
	PDFTypographySize,
	PDFTypographyType,
} from './PDFTypography';

const styles = createPDFStyles( {
	link: {
		flexDirection: 'row',
		alignItems: 'center',
		textDecoration: 'none',
	},
	truncatedLink: {
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
	},
} );

export interface PDFLinkProps {
	/** Link target URL. When an empty string: plaintext is still rendered (in the default text color and with no trailing icon). */
	href?: string;
	/** Typography type for the link text. */
	type?: PDFTypographyType;
	/** Typography size for the link text. */
	size?: PDFTypographySize;
	/** Optional icon rendered after the text, such as a chevron. */
	trailingIcon?: ReactNode;
	/** Style merged over the link color on the text. */
	style?: Style | Style[];
	/** Ends the text in an ellipsis when it's too long, and limits it to one line unless the text's own `maxLines` sets another limit. */
	truncateContent?: boolean;
}

const PDFLink: FC< PDFLinkProps > = ( {
	href,
	type,
	size,
	trailingIcon,
	style,
	truncateContent,
	children,
} ) => {
	if ( ! href ) {
		return (
			<PDFTypography
				type={ type }
				size={ size }
				style={ style }
				truncateContent={ truncateContent }
			>
				{ children }
			</PDFTypography>
		);
	}

	const linkColor: Style = { color: PDF_COLORS.CONTENT_SECONDARY };
	const linkStyle = truncateContent
		? [ styles.link, styles.truncatedLink ]
		: styles.link;

	return (
		<Link src={ href } style={ linkStyle }>
			<PDFTypography
				type={ type }
				size={ size }
				style={ style ? [ linkColor ].concat( style ) : linkColor }
				truncateContent={ truncateContent }
			>
				{ children }
			</PDFTypography>
			{ trailingIcon }
		</Link>
	);
};

export default PDFLink;

/**
 * Section of an audience card in the Your visitor groups PDF widget.
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
import { View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { PDFIcon } from '@/js/components/pdf-export/types';
import { audienceCardStyles } from './pdfAudienceCardStyles';

interface PDFAudienceCardSectionProps {
	/** The section's icon. */
	Icon: PDFIcon;
	/** Whether the section is the last one in the card, which drops the divider. */
	isLast?: boolean;
}

const PDFAudienceCardSection: FC< PDFAudienceCardSectionProps > = ( {
	Icon,
	isLast = false,
	children,
} ) => {
	return (
		<View
			style={
				isLast
					? [
							audienceCardStyles.section,
							audienceCardStyles.lastSection,
					  ]
					: audienceCardStyles.section
			}
		>
			<View style={ audienceCardStyles.sectionContent }>
				<View style={ audienceCardStyles.iconColumn }>
					<Icon />
				</View>
				{ children }
			</View>
		</View>
	);
};

export default PDFAudienceCardSection;

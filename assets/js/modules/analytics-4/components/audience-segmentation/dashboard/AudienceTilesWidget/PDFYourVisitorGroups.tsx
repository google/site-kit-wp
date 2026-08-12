/**
 * Your visitor groups PDF widget: the row of audience cards.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import type { AudienceTilesPDFData } from './getPDFData';
import PDFYourVisitorGroupsTile from './PDFYourVisitorGroupsTile';

const styles = createPDFStyles( {
	heading: {
		marginBottom: 15,
	},
	row: {
		flexDirection: 'row',
		// Stretch every card to the tallest card's height, for equal-height
		// columns.
		alignItems: 'stretch',
	},
	card: {
		// Equal-width columns: every card grows and shrinks from a zero basis.
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
	},
	cardGap: {
		width: 24,
	},
} );

const PDFYourVisitorGroups: FC< PDFWidgetComponentProps > = ( { data } ) => {
	const audienceData = data as AudienceTilesPDFData[ 'data' ] | undefined;
	const audiences = audienceData?.audiences || [];

	// With no audiences the widget renders nothing, with no placeholder.
	if ( audiences.length === 0 ) {
		return null;
	}

	return (
		<View>
			<PDFTypography size="large" style={ styles.heading }>
				{ __( 'Your visitor groups', 'google-site-kit' ) }
			</PDFTypography>
			<View style={ styles.row }>
				{ audiences.map( ( audience, index ) => (
					<Fragment key={ audience.audienceResourceName }>
						{ index > 0 && <View style={ styles.cardGap } /> }
						<View style={ styles.card }>
							<PDFYourVisitorGroupsTile
								audienceName={ audience.audienceName }
								metrics={ audience.metrics }
								topCities={ audience.topCities }
								topContent={ audience.topContent }
								isAudiencePartialData={
									audience.isAudiencePartialData
								}
								isTopContentPartialData={
									audience.isTopContentPartialData
								}
							/>
						</View>
					</Fragment>
				) ) }
			</View>
		</View>
	);
};

export default PDFYourVisitorGroups;

/**
 * Site Goals tile connector PDF component.
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
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';

const styles = createPDFStyles( {
	container: {
		alignItems: 'center',
		marginRight: 10,
		marginVertical: 20.5,
		width: 9,
	},
	line: {
		backgroundColor: PDF_COLORS.SURFACES_SURFACE_1,
		width: 2,
	},
	lineAboveDot: {
		height: 12,
	},
	lineBelowDot: {
		flex: 1,
	},
	dot: {
		backgroundColor: PDF_COLORS.SURFACES_SURFACE_1,
		borderRadius: 4.5,
		height: 9,
		width: 9,
	},
} );

const SiteGoalsTileConnectorPDF: FC = () => (
	<View style={ styles.container }>
		<View style={ [ styles.line, styles.lineAboveDot ] } />
		<View style={ styles.dot } />
		<View style={ [ styles.line, styles.lineBelowDot ] } />
	</View>
);

export default SiteGoalsTileConnectorPDF;

import { storiesOf } from '@storybook/react';
import { Select, Option } from 'SiteKitCore/material-components';
import { __ } from '@wordpress/i18n';

storiesOf( 'Global', module )
	.add( 'Selects', () => {
		return (
			<div>
				<div style={ { marginBottom: '50px' } }>
					<Select
						enhanced
						name="select"
						label={ __( 'Select', 'google-site-kit' ) }
						outlined
						options={ [
							'Demo Option 1',
							'Demo Option 2',
							'Demo Option 3',
						] }
						value="Demo Option 1"
					/>
				</div>
				<div style={ { marginBottom: '50px' } }>
					<Select
						enhanced
						name="disabled"
						label={ __( 'Disabled Select', 'google-site-kit' ) }
						outlined
						options={ [
							'Demo Option 1',
							'Demo Option 2',
							'Demo Option 3',
						] }
						value="Demo Option 1"
						disabled
					/>
				</div>
				<div style={ { marginBottom: '50px' } }>
					<Select
						enhanced
						name="select"
						label={ __( 'Placeholder Select', 'google-site-kit' ) }
						outlined
					>
						<Option value="" disabled selected></Option>
						<Option value="1">Demo Option 1 Here</Option>
						<Option value="2">Demo Option 2 Here</Option>
						<Option value="3">Demo Option 3 Here</Option>
					</Select>
				</div>
				<div style={ { marginBottom: '50px' } }>
					<Select
						enhanced
						className="mdc-select--minimal"
						name="time_period"
						label=""
						value="Last 28 days"
						options={ [
							'Last 7 days',
							'Last 28 days',
							'Demo Option 3',
						] }
					/>
				</div>
				<div style={ { marginBottom: '250px' } }>
					<Select
						enhanced
						outlined
						className="googlesitekit-story-select-click"
						name="time_period"
						label=""
						value="VRT: Open Select"
						options={ [
							'Last 7 days',
							'VRT: Open Select',
							'Demo Option 3',
						] }
					/>
				</div>
			</div>
		);
	}, {
		options: {
			delay: 3000, // Sometimes the click doesn't work, waiting for everything to load.
			clickSelector: '.googlesitekit-story-select-click',
			postInteractionWait: 3000, // Wait for overlay and selects to animate.
			onReadyScript: 'mouse.js',
		}
	} );

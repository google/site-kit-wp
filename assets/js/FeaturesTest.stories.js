import { useSelect } from 'googlesitekit-data';
import { WithTestRegistry } from '../../tests/js/utils';
import { CORE_SITE } from './googlesitekit/datastore/site/constants';
import { useFeature } from './hooks/useFeature';

function FeaturesTest() {
	const isFooEnabled = useFeature( 'foo' );

	return <p>Feature foo is { isFooEnabled ? 'enabled' : 'disabled' }</p>;
}

function WasFeatureEnabledInCallback() {
	const wasFooEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).wasFeatureEnabled( 'foo' )
	);

	return (
		<p>
			Was feature foo enabled during callback?&nbsp;
			{ wasFooEnabled ? 'yes' : 'no' }
		</p>
	);
}

export function WithDefaultDecorator() {
	return (
		<div>
			<h1>With Default Decorator</h1>
			<FeaturesTest />
		</div>
	);
}
WithDefaultDecorator.parameters = {
	features: [ 'foo' ],
};

export function WithTestRegistryInStory() {
	return (
		<div>
			<h1>With Test Registry In Story</h1>
			<WithTestRegistry
				features={ [ 'foo' ] }
				callback={ ( registry ) => {
					registry.dispatch( CORE_SITE ).checkFeatureEnabled( 'foo' );
				} }
			>
				<FeaturesTest />
				<WasFeatureEnabledInCallback />
			</WithTestRegistry>
		</div>
	);
}

export default {
	title: 'FeaturesTest',
	component: FeaturesTest,
};

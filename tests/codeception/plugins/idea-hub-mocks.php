<?php
/**
 * Plugin Name: E2E Tests Idea Hub Mocks Plugin
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Provides mocks for the Idea Hub module.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

use Google\Site_Kit_Dependencies\Google\Service\Ideahub\GoogleSearchIdeahubV1alphaIdea;
use Google\Site_Kit_Dependencies\Google\Service\Ideahub\GoogleSearchIdeahubV1alphaListIdeasResponse;
use Google\Site_Kit_Dependencies\Google\Service\Ideahub\GoogleSearchIdeahubV1alphaTopic;

class Idea_Hub_SDK_Mock {

	private $fetch;

	public function __construct( $fetch = null ) {
		$this->fetch = $fetch;
	}

	public function fetch() {
		return is_callable( $this->fetch )
			? call_user_func( $this->fetch )
			: function() {
				return array();
			};
	}

}

function googlesitekit_idea_hub_fixture_to_response( $fixture ) {
	$ideas = array();

	foreach ( $fixture as $idea_data ) {
		$topics = array();
		$idea   = new GoogleSearchIdeahubV1alphaIdea();

		foreach ( $idea_data['topics'] as $topic_data ) {
			$topic = new GoogleSearchIdeahubV1alphaTopic();

			$topic->setMid( $topic_data['mid'] );
			$topic->setDisplayName( $topic_data['displayName'] );

			$topics[] = $topic;
		}

		$idea->setName( $idea_data['name'] );
		$idea->setText( $idea_data['text'] );
		$idea->setTopics( $topics );

		$ideas[] = $idea;
	}

	$response = new GoogleSearchIdeahubV1alphaListIdeasResponse();
	$response->setIdeas( $ideas );

	return $response;
}

add_filter(
	'googlesitekit_is_feature_enabled',
	function( $enabled, $feature_flag ) {
		if ( 'ideaHubModule' === $feature_flag ) {
			return true;
		}

		return $enabled;
	},
	PHP_INT_MAX,
	2
);

add_action(
	'googlesitekit_setup_di',
	function( $di ) {
		$di['ideahub_new_ideas'] = function() {
			$mock = new Idea_Hub_SDK_Mock(
				function() {
					return function() {
						$fixture = include __DIR__ . '/idea-hub/new-ideas.php';
						return googlesitekit_idea_hub_fixture_to_response( $fixture );
					};
				}
			);

			return $mock;
		};

		$di['ideahub_saved_ideas'] = function() {
			$mock = new Idea_Hub_SDK_Mock(
				function() {
					return function() {
						$fixture = include __DIR__ . '/idea-hub/saved-ideas.php';
						return googlesitekit_idea_hub_fixture_to_response( $fixture );
					};
				}
			);

			return $mock;
		};

		$di['ideahub_idea_state'] = function() {
			$mock = new Idea_Hub_SDK_Mock();
			return $mock;
		};

		$di['ideahub_activities'] = function() {
			$mock = new Idea_Hub_SDK_Mock();
			return $mock;
		};
	},
	999
);

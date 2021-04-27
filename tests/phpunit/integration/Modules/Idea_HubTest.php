<?php
/**
 * Idea_HubTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Idea_Hub\Settings;
use Google\Site_Kit\Modules\Idea_Hub;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class Idea_HubTest extends TestCase {
	use Module_With_Settings_ContractTests;

	public function test_register() {
		$idea_hub = new Idea_Hub( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'googlesitekit_auth_scopes' );

		$idea_hub->register();

		// Adding required scopes.
		$this->assertEquals(
			$idea_hub->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);
	}

	public function test_get_scopes() {
		$idea_hub = new Idea_Hub( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/ideahub.read',
			),
			$idea_hub->get_scopes()
		);
	}

	public function test_is_connected() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new Options( $context );

		$idea_hub = new Idea_Hub( $context, $options );

		$this->assertFalse( $idea_hub->is_connected() );

		$options->set(
			Settings::OPTION,
			array(
				'ideaLocale' => 'en_US',
			)
		);

		$this->assertTrue( $idea_hub->is_connected() );
	}

	public function test_on_deactivation() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new Options( $context );
		$options->set( Settings::OPTION, 'test-value' );

		$idea_hub = new Idea_Hub( $context, $options );
		$idea_hub->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
	}

	public function test_get_datapoints() {
		$idea_hub = new Idea_Hub( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'draft-post-ideas',
				'new-ideas',
				'published-post-ideas',
				'saved-ideas',
				'create-idea-draft-post',
				'update-idea-state',
			),
			$idea_hub->get_datapoints()
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new Idea_Hub( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return new Idea_Hub( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}
}

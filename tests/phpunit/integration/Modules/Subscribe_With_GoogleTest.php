<?php
/**
 * Subscribe_With_GoogleTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Owner;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Analytics\Settings as AnalyticsSettings;
use Google\Site_Kit\Modules\Subscribe_With_Google;
use Google\Site_Kit\Modules\Subscribe_With_Google\Settings;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Owner_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class Subscribe_With_GoogleTest extends TestCase {
	use Module_With_Scopes_ContractTests;
	use Module_With_Owner_ContractTests;

	public function test_register() {
		$subscribewithgoogle = new Subscribe_With_Google( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_filters( 'manage_posts_columns' );

		$subscribewithgoogle->register();

		$this->assertTrue( has_filter( 'manage_posts_columns' ) );
	}

	public function test_is_connected() {
		$subscribewithgoogle = new Subscribe_With_Google( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertFalse( $subscribewithgoogle->is_connected() );

		$subscribewithgoogle->get_settings()->merge(
			array(
				'publicationID' => 'example.com',
				'products'      => 'basic',
			)
		);

		$this->assertTrue( $subscribewithgoogle->is_connected() );
	}

	public function test_on_deactivation() {
		$subscribewithgoogle = new Subscribe_With_Google( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options             = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options->set( Settings::OPTION, 'test-value' );

		$subscribewithgoogle->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new Subscribe_With_Google( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Owner
	 */
	protected function get_module_with_owner() {
		return new Subscribe_With_Google( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}
}

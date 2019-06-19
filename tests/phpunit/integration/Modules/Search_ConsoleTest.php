<?php
/**
 * Search_ConsoleTest
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Screen;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Scopes_ContractTests;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Screen_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class Search_ConsoleTest extends TestCase {
	use Module_With_Scopes_ContractTests;
	use Module_With_Screen_ContractTests;

	public function test_magic_methods() {
		$search_console = new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEquals( 'search-console', $search_console->slug );
		$this->assertTrue( $search_console->force_active );
		$this->assertEquals( 'https://search.google.com/search-console', $search_console->homepage );
	}

	public function test_register() {
		$search_console = new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$property_url   = 'https://example.com';

		remove_all_filters( 'googlesitekit_auth_scopes' );
		remove_all_filters( 'googlesitekit_module_screens' );
		remove_all_filters( 'googlesitekit_setup_complete' );
		remove_all_filters( 'googlesitekit_site_url' );

		$this->assertEmpty( apply_filters( 'googlesitekit_auth_scopes', array() ) );
		$this->assertEmpty( apply_filters( 'googlesitekit_module_screens', array() ) );
		$this->assertTrue( apply_filters( 'googlesitekit_setup_complete', true ) );
		$this->assertEmpty( apply_filters( 'googlesitekit_site_url', '' ) );

		// Register search console.
		$search_console->register();

		// Test registers scopes.
		$this->assertEquals(
			$search_console->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);

		// Test registers screen.
		$this->assertContains(
			$search_console->get_screen(),
			apply_filters( 'googlesitekit_module_screens', array() )
		);

		// Site url is unaffected if property is not set.
		$this->assertEquals( '', apply_filters( 'googlesitekit_site_url', '' ) );

		// Test sitekit setup complete requires property set.
		$this->assertFalse( apply_filters( 'googlesitekit_setup_complete', true ) );
		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$options->set( Search_Console::PROPERTY_OPTION, $property_url );
		$this->assertTrue( apply_filters( 'googlesitekit_setup_complete', true ) );

		// Site url uses property URL by default.
		$this->assertEquals( $property_url, apply_filters( 'googlesitekit_site_url', '' ) );

		add_filter( 'googlesitekit_site_url', function () {
			return 'https://other.example.com';
		} );

		// Property URL filters googlesitekit_site_url on a very low priority
		$this->assertEquals( 'https://other.example.com', apply_filters( 'googlesitekit_site_url', '' ) );
	}

	public function test_get_module_scopes() {
		$search_console = new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/webmasters',
				'https://www.googleapis.com/auth/siteverification',
			),
			$search_console->get_scopes()
		);
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Screen
	 */
	protected function get_module_with_screen() {
		return new Search_Console( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}
}

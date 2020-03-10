<?php
/**
 * Class Google\Site_Kit\Tests\Core\Util\Migration_n_e_x_tTest
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Migration_n_e_x_t;
use Google\Site_Kit\Tests\TestCase;

class Migration_n_e_x_tTest extends TestCase /* phpcs:ignore PEAR.NamingConventions.ValidClassName.Invalid */ {
	public function test_register() {
		$migration = new Migration_n_e_x_t( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		remove_all_actions( 'admin_init' );

		$migration->register();

		$this->assertTrue( has_action( 'admin_init' ) );
	}

	public function test_migrate() {
		$context   = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options   = new Options( $context );
		$migration = new Migration_n_e_x_t( $context, $options );

		// Test clean install.
		$options->delete( 'googlesitekit_db_version' );
		$migration->migrate();

		$this->assertEquals(
			$migration->db_version,
			$options->get( 'googlesitekit_db_version' )
		);

		// Test upgrade.
		$options->set( 'googlesitekit_db_version', '1.0' );
		$this->force_set_property( $migration, 'db_version', '1.5.0' );
		$migration->migrate();

		$this->assertEquals(
			'1.5.0',
			$options->get( 'googlesitekit_db_version' )
		);
	}
}

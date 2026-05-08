<?php
/**
 * Disconnected_ModulesTest
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Modules\Disconnected_Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

class Disconnected_ModulesTest extends SettingsTestCase {

	/**
	 * Disconnected_Modules instance.
	 *
	 * @since 1.172.0
	 * @var Disconnected_Modules
	 */
	private $disconnected_modules;

	public function set_up() {
		parent::set_up();

		$context                    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options                    = new Options( $context );
		$this->disconnected_modules = new Disconnected_Modules( $options );
	}

	public function test_add() {
		$module_slug = 'test-module';

		// Initially, the module should not be in the disconnected list.
		$this->assertFalse( $this->get_option(), 'Disconnected modules option should be empty initially.' );

		// Disconnect the module.
		$result = $this->disconnected_modules->add( $module_slug );
		$this->assertTrue( $result, 'Disconnect should return true on success.' );

		// Now, the module should be in the disconnected list with a timestamp.
		$disconnected_modules = $this->get_option();
		$this->assertArrayHasKey( $module_slug, $disconnected_modules, 'The disconnected modules setting should contain the disconnected module.' );
		$this->assertIsInt( $disconnected_modules[ $module_slug ], 'The disconnection timestamp should be an integer.' );

		// Disconnecting the same module again should update the timestamp.
		sleep( 1 ); // Ensure the timestamp will be different.
		$result = $this->disconnected_modules->add( $module_slug );
		$this->assertTrue( $result, 'Disconnect should return true on success.' );
		$disconnected_modules_updated = $this->get_option();
		$this->assertGreaterThan(
			$disconnected_modules[ $module_slug ],
			$disconnected_modules_updated[ $module_slug ],
			'The disconnection timestamp should be updated on re-disconnect.'
		);

		// Disconnecting another module adds it to the list.
		$another_module_slug = 'another-module';
		$result              = $this->disconnected_modules->add( $another_module_slug );
		$this->assertTrue( $result, 'Disconnect should return true on success.' );
		$disconnected_modules_final = $this->get_option();
		$this->assertArrayHasKey( $another_module_slug, $disconnected_modules_final, 'The disconnected modules setting should contain the newly disconnected module.' );
	}

	public function test_remove() {
		$module_slug = 'test-module';

		// Add a module to the disconnected list first.
		$this->update_option( array( $module_slug => time() ) );
		$disconnected_modules = $this->get_option();
		$this->assertArrayHasKey( $module_slug, $disconnected_modules, 'The disconnected modules setting should contain a test module.' );

		// Now remove it.
		$result = $this->disconnected_modules->remove( $module_slug );
		$this->assertTrue( $result, 'Remove should return true on success.' );

		// The module should no longer be in the disconnected list.
		$disconnected_modules = $this->get_option();
		$this->assertArrayNotHasKey( $module_slug, $disconnected_modules, 'The disconnected modules setting should not contain the removed module.' );

		// Trying to remove a non-existent module should return false.
		$result = $this->disconnected_modules->remove( 'non-existent-module' );
		$this->assertFalse( $result, 'Remove should return false when trying to remove a non-existent module.' );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Disconnected_Modules::OPTION;
	}
}

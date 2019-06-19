<?php
/**
 * Class Google\Site_Kit\Tests\Core\Authentication\GCP_ProjectTest
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\GCP_Project;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * GCP_ProjectTest
 *
 * @group Authentication
 */
class GCP_ProjectTest extends TestCase {

	/**
	 * GCP project object.
	 *
	 * @var GCP_Project
	 */
	private $gcp_project;

	/**
	 * Set Up Test.
	 */
	public function setUp() {
		parent::setUp();

		$options = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$this->gcp_project = new GCP_Project( $options );
	}

	/**
	 * Test get() method.
	 */
	public function test_get() {
		$defaults = array(
			'id'          => '',
			'wp_owner_id' => 0,
		);

		$this->assertEqualSetsWithIndex( $defaults, $this->gcp_project->get() );

		$data       = $defaults;
		$data['id'] = 'fake-gcp-project-id';

		$this->gcp_project->set( array( 'id' => $data['id'] ) );
		$this->assertEqualSetsWithIndex( $data, $this->gcp_project->get() );
	}

	/**
	 * Test set() method.
	 */
	public function test_set() {
		$defaults = array(
			'id'          => '',
			'wp_owner_id' => 0,
		);

		$data                = $defaults;
		$data['id']          = 'fake-gcp-project-id';
		$data['wp_owner_id'] = 3;

		$this->assertTrue( $this->gcp_project->set( $data ) );
		$this->assertEqualSetsWithIndex( $data, $this->gcp_project->get() );

		$this->assertTrue( $this->gcp_project->set( array() ) );
		$this->assertEqualSetsWithIndex( $defaults, $this->gcp_project->get() );
	}

	/**
	 * Test has() method.
	 */
	public function test_has() {
		$this->assertFalse( $this->gcp_project->has() );

		$this->gcp_project->set( array( 'id' => 'fake-gcp-project-id' ) );
		$this->assertTrue( $this->gcp_project->has() );
	}
}

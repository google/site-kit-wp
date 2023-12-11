<?php
/**
 * Class Google\Site_Kit\Core\Util\Network_Mode_Notice.php
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Contracts\Registerable;

class Network_Mode_Notice implements Registerable {
	public function register() {
		add_action( 'network_admin_notices', [ $this, 'render' ] );
	}

	public function render() {
		?>
		<div class="notice notice-warning">
			<p>
				<?php
				echo wp_kses(
					__( 'The Site Kit by Google plugin does <strong>not yet offer</strong> a network mode, but we&#8217;re actively working on that.', 'google-site-kit' ),
					array(
						'strong' => array(),
					)
				);
				?>
			</p>
		</div>
		<?php
	}
}

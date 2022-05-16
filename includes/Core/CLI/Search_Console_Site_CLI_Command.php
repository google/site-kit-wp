<?php
/**
 * Class Google\Site_Kit\Core\CLI\Search_Console_Site_CLI_Command
 *
 * @package   Google\Site_Kit\Core\CLI
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\CLI;

use Exception;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\CLI\Traits\CLI_Auth;
use Google\Site_Kit\Core\CLI\Traits\Runtime_Input;
use Google\Site_Kit_Dependencies\Google\Service\Exception as Google_Service_Exception;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole;
use Google\Site_Kit_Dependencies\Google\Service\SearchConsole\WmxSite;
use WP_CLI;
use function WP_CLI\Utils\get_flag_value;

/**
 * Manages Search Console sites.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Search_Console_Site_CLI_Command extends CLI_Command {
	use CLI_Auth;
	use Runtime_Input;

	/**
	 * Lists all Search Console sites for a user.
	 *
	 * ## OPTIONS
	 *
	 * [<glob>]
	 * : Glob to filter by. Includes all sites by default.
	 *
	 * [--permissions=<level>]
	 * : Permissions to filter by or a comma-separated list of multiple.
	 * Permission levels:
	 * * siteUnverifiedUser
	 * * siteFullUser
	 * * siteOwner
	 *
	 * @subcommand list
	 */
	public function _list( $args, $assoc_args ) {
		$this->require_auth_or_fail();

		$glob  = reset( $args );
		$sites = $this->get_all( $glob, $assoc_args );

		$items = array_map(
			function ( WmxSite $site ) {
				$site_url         = $site->getSiteUrl();
				$permission_level = $site->getPermissionLevel();

				return compact( 'site_url', 'permission_level' );
			},
			$sites
		);

		$formatter = new WP_CLI\Formatter( $assoc_args, array( 'site_url', 'permission_level' ) );
		$formatter->display_items( $items );
	}

	/**
	 * Deletes Search Console sites.
	 *
	 * [<glob>]
	 * : Glob to filter by. Includes all sites by default.
	 *
	 * [--permissions=<level>]
	 * : Permissions to filter by or a comma-separated list of multiple.
	 * Permission levels:
	 * * siteUnverifiedUser
	 * * siteFullUser
	 * * siteOwner
	 *
	 * [--yes]
	 * : Pre-confirms the prompt to delete. Use carefully.
	 *
	 * @param $args
	 * @param $assoc_args
	 */
	public function delete( $args, $assoc_args ) {
		$this->require_auth_or_fail();

		$glob  = reset( $args );
		$sites = $this->get_all( $glob, $assoc_args );

		if ( ! $sites ) {
			WP_CLI::line( 'No sites were found to delete.' );
			return;
		}

		if ( ! get_flag_value( $assoc_args, 'yes' ) ) {
			WP_CLI::line( 'The following Search Console sites are about to be deleted:' );

			foreach ( $sites as $site ) {
				/** @var WmxSite $site */
				WP_CLI::line( $site->getSiteUrl() );
			}

			try {
				$this->confirm( 'Are you sure?' );
				$this->delete_sites( $sites );
			} catch ( Exception $exception ) {
				WP_CLI::line( 'No sites were deleted.' );
				exit;
			}
		}
	}

	/**
	 * @param WmxSite[] $sites
	 */
	protected function delete_sites( array $sites ) {
		$sites_resource = $this->get_service()->sites;

		foreach ( $sites as $site ) {
			$site_url = $site->getSiteUrl();

			try {
				$sites_resource->delete( $site_url );
				WP_CLI::success( "Deleted Search Console site: $site_url" );
			} catch ( Google_Service_Exception $e ) {
				WP_CLI::line( "Failed to delete Search Console site: $site_url" );
				WP_CLI::warning( $e->getMessage() );
			}
		}
	}

	/**
	 * @throws WP_CLI\ExitException
	 */
	protected function get_all( $glob, $assoc_args ) {
		$sites = $this->get_service()->sites->listSites();
		$sites = (array) $sites->getSiteEntry();

		if ( $glob ) {
			$sites = $this->filter_sites_by_glob( $sites, $glob );
		}

		$permissions = get_flag_value( $assoc_args, 'permissions' );
		if ( $permissions ) {
			$sites = $this->filter_sites_by_permissions( $sites, $permissions );
		}

		return $sites;
	}

	/**
	 * @param WmxSite[] $sites
	 * @param $glob
	 *
	 * @return array
	 */
	protected function filter_sites_by_glob( array $sites, $glob ) {
		return array_filter(
			$sites,
			function ( WmxSite $site ) use ( $glob ) {
				return fnmatch( $glob, $site->getSiteUrl() );
			}
		);
	}

	/**
	 * @param WmxSite[] $sites
	 * @param string    $permissions
	 *
	 * @return array
	 */
	protected function filter_sites_by_permissions( $sites, $permissions ) {
		return array_filter(
			$sites,
			function ( WmxSite $site ) use ( $permissions ) {
				$levels = explode( ',', $permissions );

				return in_array( $site->getPermissionLevel(), $levels );
			}
		);
	}

	/**
	 * Gets the Search Console API service instance.
	 *
	 * @return SearchConsole
	 */
	protected function get_service() {
		$authentication = new Authentication( $this->context );

		return new SearchConsole( $authentication->get_oauth_client()->get_client() );
	}
}

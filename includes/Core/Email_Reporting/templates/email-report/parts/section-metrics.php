<?php
/**
 * Metrics section template.
 *
 * This template renders a section with individual metric rows (e.g., visitors section).
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var array    $section            Section configuration including title, icon, section_parts.
 * @var callable $render_part        Function to render a template part by name.
 * @var callable $render_shared_part Function to render a shared part by name.
 * @var callable $get_asset_url      Function to get asset URLs.
 */

$section_title = $section['title'];
$section_icon  = $section['icon'];
$dashboard_url = $section['dashboard_url'];
$section_parts = $section['section_parts'];

// Get the first metric's change_context for the subtitle.
$first_part = reset( $section_parts );
$subtitle   = $first_part['data']['change_context'] ?? '';
?>
<table role="presentation" width="100%" style="margin-bottom:24px;">
	<tr>
		<td style="background-color: #FFFFFF; border-radius: 16px; padding: 16px;">
			<?php
			// Render section header.
			$icon_url = $get_asset_url( 'icon-' . esc_html( $section_icon ) . '.png' );
			$render_part(
				'section-header',
				array(
					'icon'     => $icon_url,
					'title'    => $section_title,
					'subtitle' => '',
				)
			);
			?>

			<table role="presentation" width="100%" style="margin-bottom:12px;">
				<tr>
					<td>&nbsp;</td>
					<td width="110" style="text-align: right; font-size:12px; line-height:16px; font-weight:500; color:#6C726E; width: 110px;">
						<?php echo esc_html( $subtitle ); ?>
					</td>
				</tr>
				<?php
				$total_parts = count( $section_parts );
				$current     = 0;

				// Render each metric row.
				foreach ( $section_parts as $part_key => $part_config ) {
					++$current;
					$data         = $part_config['data'];
					$is_last      = $current === $total_parts;
					$border_style = $is_last ? 'none' : '1px solid #EBEEF0';
					?>
					<tr>
						<td style="vertical-align: top; border-bottom: <?php echo esc_attr( $border_style ); ?>; padding: 12px 0;">
							<div style="font-size:12px; line-height:16px; font-weight:500; color:#6C726E; margin-bottom:4px;">
								<?php echo esc_html( $data['label'] ); ?>
							</div>
							<div style="font-size:14px; line-height:20px; font-weight:500;">
								<?php echo esc_html( $data['value'] ); ?>
							</div>
						</td>
						<td style="text-align: right; vertical-align: middle; border-bottom: <?php echo esc_attr( $border_style ); ?>; padding: 12px 0;">
							<?php
							$render_shared_part(
								'change-badge',
								array(
									'value' => $data['change'],
								)
							);
							?>
						</td>
					</tr>
					<?php
				}
				?>
			</table>
			<?php

			// Render view more in dashboard link.
			$render_part(
				'view-more-in-dashboard',
				array(
					'url'           => $dashboard_url,
					'get_asset_url' => $get_asset_url,
				)
			);
			?>
		</td>
	</tr>
</table>


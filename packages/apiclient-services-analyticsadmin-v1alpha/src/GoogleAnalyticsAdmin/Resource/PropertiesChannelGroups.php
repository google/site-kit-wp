<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\GoogleAnalyticsAdmin\Resource;

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaChannelGroup;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListChannelGroupsResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "channelGroups" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $channelGroups = $analyticsadminService->properties_channelGroups;
 *  </code>
 */
class PropertiesChannelGroups extends \Google\Service\Resource
{
  /**
   * Creates a ChannelGroup. (channelGroups.create)
   *
   * @param string $parent Required. The property for which to create a
   * ChannelGroup. Example format: properties/1234
   * @param GoogleAnalyticsAdminV1alphaChannelGroup $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaChannelGroup
   * @throws \Google\Service\Exception
   */
  public function create($parent, GoogleAnalyticsAdminV1alphaChannelGroup $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1alphaChannelGroup::class);
  }
  /**
   * Deletes a ChannelGroup on a property. (channelGroups.delete)
   *
   * @param string $name Required. The ChannelGroup to delete. Example format:
   * properties/1234/channelGroups/5678
   * @param array $optParams Optional parameters.
   * @return GoogleProtobufEmpty
   * @throws \Google\Service\Exception
   */
  public function delete($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('delete', [$params], GoogleProtobufEmpty::class);
  }
  /**
   * Lookup for a single ChannelGroup. (channelGroups.get)
   *
   * @param string $name Required. The ChannelGroup to get. Example format:
   * properties/1234/channelGroups/5678
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaChannelGroup
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaChannelGroup::class);
  }
  /**
   * Lists ChannelGroups on a property.
   * (channelGroups.listPropertiesChannelGroups)
   *
   * @param string $parent Required. The property for which to list ChannelGroups.
   * Example format: properties/1234
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize The maximum number of resources to return. If
   * unspecified, at most 50 resources will be returned. The maximum value is 200
   * (higher values will be coerced to the maximum).
   * @opt_param string pageToken A page token, received from a previous
   * `ListChannelGroups` call. Provide this to retrieve the subsequent page. When
   * paginating, all other parameters provided to `ListChannelGroups` must match
   * the call that provided the page token.
   * @return GoogleAnalyticsAdminV1alphaListChannelGroupsResponse
   * @throws \Google\Service\Exception
   */
  public function listPropertiesChannelGroups($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListChannelGroupsResponse::class);
  }
  /**
   * Updates a ChannelGroup. (channelGroups.patch)
   *
   * @param string $name Output only. The resource name for this Channel Group
   * resource. Format: properties/{property}/channelGroups/{channel_group}
   * @param GoogleAnalyticsAdminV1alphaChannelGroup $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Field names must be in snake case (e.g., "field_to_update"). Omitted fields
   * will not be updated. To replace the entire entity, use one path with the
   * string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaChannelGroup
   * @throws \Google\Service\Exception
   */
  public function patch($name, GoogleAnalyticsAdminV1alphaChannelGroup $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], GoogleAnalyticsAdminV1alphaChannelGroup::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PropertiesChannelGroups::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_PropertiesChannelGroups');

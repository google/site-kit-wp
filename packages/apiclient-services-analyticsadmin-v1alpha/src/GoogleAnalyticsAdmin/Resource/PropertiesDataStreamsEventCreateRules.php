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

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaEventCreateRule;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListEventCreateRulesResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "eventCreateRules" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $eventCreateRules = $analyticsadminService->properties_dataStreams_eventCreateRules;
 *  </code>
 */
class PropertiesDataStreamsEventCreateRules extends \Google\Service\Resource
{
  /**
   * Creates an EventCreateRule. (eventCreateRules.create)
   *
   * @param string $parent Required. Example format:
   * properties/123/dataStreams/456
   * @param GoogleAnalyticsAdminV1alphaEventCreateRule $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaEventCreateRule
   * @throws \Google\Service\Exception
   */
  public function create($parent, GoogleAnalyticsAdminV1alphaEventCreateRule $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1alphaEventCreateRule::class);
  }
  /**
   * Deletes an EventCreateRule. (eventCreateRules.delete)
   *
   * @param string $name Required. Example format:
   * properties/123/dataStreams/456/eventCreateRules/789
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
   * Lookup for a single EventCreateRule. (eventCreateRules.get)
   *
   * @param string $name Required. The name of the EventCreateRule to get. Example
   * format: properties/123/dataStreams/456/eventCreateRules/789
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaEventCreateRule
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaEventCreateRule::class);
  }
  /**
   * Lists EventCreateRules on a web data stream.
   * (eventCreateRules.listPropertiesDataStreamsEventCreateRules)
   *
   * @param string $parent Required. Example format:
   * properties/123/dataStreams/456
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize The maximum number of resources to return. If
   * unspecified, at most 50 resources will be returned. The maximum value is 200
   * (higher values will be coerced to the maximum).
   * @opt_param string pageToken A page token, received from a previous
   * `ListEventCreateRules` call. Provide this to retrieve the subsequent page.
   * When paginating, all other parameters provided to `ListEventCreateRules` must
   * match the call that provided the page token.
   * @return GoogleAnalyticsAdminV1alphaListEventCreateRulesResponse
   * @throws \Google\Service\Exception
   */
  public function listPropertiesDataStreamsEventCreateRules($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListEventCreateRulesResponse::class);
  }
  /**
   * Updates an EventCreateRule. (eventCreateRules.patch)
   *
   * @param string $name Output only. Resource name for this EventCreateRule
   * resource. Format: properties/{property}/dataStreams/{data_stream}/eventCreate
   * Rules/{event_create_rule}
   * @param GoogleAnalyticsAdminV1alphaEventCreateRule $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Field names must be in snake case (e.g., "field_to_update"). Omitted fields
   * will not be updated. To replace the entire entity, use one path with the
   * string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaEventCreateRule
   * @throws \Google\Service\Exception
   */
  public function patch($name, GoogleAnalyticsAdminV1alphaEventCreateRule $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], GoogleAnalyticsAdminV1alphaEventCreateRule::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PropertiesDataStreamsEventCreateRules::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_PropertiesDataStreamsEventCreateRules');

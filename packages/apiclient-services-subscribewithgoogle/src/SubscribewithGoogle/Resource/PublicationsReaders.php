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

namespace Google\Service\SubscribewithGoogle\Resource;

use Google\Service\SubscribewithGoogle\Reader;

/**
 * The "readers" collection of methods.
 * Typical usage is:
 *  <code>
 *   $subscribewithgoogleService = new Google\Service\SubscribewithGoogle(...);
 *   $readers = $subscribewithgoogleService->publications_readers;
 *  </code>
 */
class PublicationsReaders extends \Google\Service\Resource
{
  /**
   * Gets Reader's Profile information. (readers.get)
   *
   * @param string $name Required. The resource name of the Reader. Format:
   * publications/{publication}/readers/{reader}
   * @param array $optParams Optional parameters.
   * @return Reader
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], Reader::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PublicationsReaders::class, 'Google_Service_SubscribewithGoogle_Resource_PublicationsReaders');

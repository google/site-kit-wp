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

namespace Google\Service\GoogleAnalyticsAdmin;

class GoogleAnalyticsAdminV1alphaBigQueryLink extends \Google\Collection
{
  protected $collection_key = 'exportStreams';
  /**
   * @var string
   */
  public $createTime;
  /**
   * @var bool
   */
  public $dailyExportEnabled;
  /**
   * @var string
   */
  public $datasetLocation;
  /**
   * @var string[]
   */
  public $excludedEvents;
  /**
   * @var string[]
   */
  public $exportStreams;
  /**
   * @var bool
   */
  public $freshDailyExportEnabled;
  /**
   * @var bool
   */
  public $includeAdvertisingId;
  /**
   * @var string
   */
  public $name;
  /**
   * @var string
   */
  public $project;
  /**
   * @var bool
   */
  public $streamingExportEnabled;

  /**
   * @param string
   */
  public function setCreateTime($createTime)
  {
    $this->createTime = $createTime;
  }
  /**
   * @return string
   */
  public function getCreateTime()
  {
    return $this->createTime;
  }
  /**
   * @param bool
   */
  public function setDailyExportEnabled($dailyExportEnabled)
  {
    $this->dailyExportEnabled = $dailyExportEnabled;
  }
  /**
   * @return bool
   */
  public function getDailyExportEnabled()
  {
    return $this->dailyExportEnabled;
  }
  /**
   * @param string
   */
  public function setDatasetLocation($datasetLocation)
  {
    $this->datasetLocation = $datasetLocation;
  }
  /**
   * @return string
   */
  public function getDatasetLocation()
  {
    return $this->datasetLocation;
  }
  /**
   * @param string[]
   */
  public function setExcludedEvents($excludedEvents)
  {
    $this->excludedEvents = $excludedEvents;
  }
  /**
   * @return string[]
   */
  public function getExcludedEvents()
  {
    return $this->excludedEvents;
  }
  /**
   * @param string[]
   */
  public function setExportStreams($exportStreams)
  {
    $this->exportStreams = $exportStreams;
  }
  /**
   * @return string[]
   */
  public function getExportStreams()
  {
    return $this->exportStreams;
  }
  /**
   * @param bool
   */
  public function setFreshDailyExportEnabled($freshDailyExportEnabled)
  {
    $this->freshDailyExportEnabled = $freshDailyExportEnabled;
  }
  /**
   * @return bool
   */
  public function getFreshDailyExportEnabled()
  {
    return $this->freshDailyExportEnabled;
  }
  /**
   * @param bool
   */
  public function setIncludeAdvertisingId($includeAdvertisingId)
  {
    $this->includeAdvertisingId = $includeAdvertisingId;
  }
  /**
   * @return bool
   */
  public function getIncludeAdvertisingId()
  {
    return $this->includeAdvertisingId;
  }
  /**
   * @param string
   */
  public function setName($name)
  {
    $this->name = $name;
  }
  /**
   * @return string
   */
  public function getName()
  {
    return $this->name;
  }
  /**
   * @param string
   */
  public function setProject($project)
  {
    $this->project = $project;
  }
  /**
   * @return string
   */
  public function getProject()
  {
    return $this->project;
  }
  /**
   * @param bool
   */
  public function setStreamingExportEnabled($streamingExportEnabled)
  {
    $this->streamingExportEnabled = $streamingExportEnabled;
  }
  /**
   * @return bool
   */
  public function getStreamingExportEnabled()
  {
    return $this->streamingExportEnabled;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaBigQueryLink::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaBigQueryLink');

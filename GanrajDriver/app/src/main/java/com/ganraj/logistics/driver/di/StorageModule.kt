package com.ganraj.logistics.driver.di

import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/**
 * TokenStorage and PendingLocationStore are @Singleton classes with @Inject constructors,
 * so Hilt provides them automatically. This module is kept as the home for any future
 * storage bindings (for example a DataStore or Room database).
 */
@Module
@InstallIn(SingletonComponent::class)
object StorageModule

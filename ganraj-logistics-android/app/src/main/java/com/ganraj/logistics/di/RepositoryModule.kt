package com.ganraj.logistics.di

import com.ganraj.logistics.data.repository.AdminRepository
import com.ganraj.logistics.data.repository.BookingRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun provideBookingRepository(impl: BookingRepository): BookingRepository = impl

    @Provides
    @Singleton
    fun provideAdminRepository(impl: AdminRepository): AdminRepository = impl
}

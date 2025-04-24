import React from 'react'
import { Link } from 'react-router-dom'

const Start = () => {
  return (
    <div
      className='h-screen w-full bg-cover bg-center relative'
      style={{
        backgroundImage: "url('/taxi.jpg')",
      }}
    >
      <div className='absolute inset-0 bg-black bg-opacity-40'></div>

      <div className='relative z-10 flex flex-col justify-center items-center h-full text-white px-4'>
        <img
          className='w-32 absolute left-5 top-5'
          src='https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png'
          alt='Uber Logo'
        />
        <div className='text-center mt-20'>
          <h1 className='text-4xl font-bold mb-4'>Welcome to Uber</h1>
          <p className='text-lg'>Your ride, your way. Tap below to begin.</p>
        </div>

        <Link
          to='/login'
          className='mt-10 bg-white text-black px-6 py-3 rounded-full text-lg hover:bg-gray-200 transition duration-300'
        >
          Get Started
        </Link>
      </div>
    </div>
  )
}

export default Start
